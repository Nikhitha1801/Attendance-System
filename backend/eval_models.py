"""Offline evaluation for face detection and recognition models.

Run from the backend directory with ``python eval_models.py``. Evaluation
images and labels are local-only and are not included in version control.
"""
import argparse
import csv
import os
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Callable, Dict, List, Tuple

import cv2
import numpy as np

from app.core import face_engine


BACKEND_DIR = Path(__file__).resolve().parent
DETECTION_DIR = BACKEND_DIR / "eval_data" / "detection"
RECOGNITION_DIR = BACKEND_DIR / "eval_data" / "recognition"
IMAGE_EXTENSIONS = {".jpg", ".jpeg"}


def _read_image(path: Path) -> np.ndarray:
    image = cv2.imread(str(path), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError(f"Could not read evaluation image: {path}")
    return image


def _resolve_dataset_image(root: Path, name: str) -> Path:
    image_path = (root / name).resolve()
    if os.path.commonpath((str(root.resolve()), str(image_path))) != str(root.resolve()):
        raise ValueError(f"Image path must stay inside {root}: {name}")
    if not image_path.is_file():
        raise FileNotFoundError(f"Evaluation image not found: {image_path}")
    return image_path


def _read_detection_labels() -> List[Tuple[str, int]]:
    labels_path = DETECTION_DIR / "labels.csv"
    if not DETECTION_DIR.is_dir():
        raise FileNotFoundError(f"Detection evaluation folder is missing: {DETECTION_DIR}")
    if not labels_path.is_file():
        raise FileNotFoundError(f"Detection labels file is missing: {labels_path}")

    rows = []
    with labels_path.open("r", newline="", encoding="utf-8-sig") as csv_file:
        reader = csv.DictReader(csv_file)
        if not reader.fieldnames or not {"image", "num_faces"}.issubset(reader.fieldnames):
            raise ValueError("Detection labels.csv must have columns: image,num_faces")
        for line_number, row in enumerate(reader, start=2):
            image_name = (row.get("image") or "").strip()
            if not image_name:
                raise ValueError(f"Missing image value in labels.csv row {line_number}")
            try:
                num_faces = int(row["num_faces"])
            except (TypeError, ValueError):
                raise ValueError(
                    f"num_faces must be a non-negative integer in labels.csv row {line_number}"
                )
            if num_faces < 0:
                raise ValueError(
                    f"num_faces must be a non-negative integer in labels.csv row {line_number}"
                )
            rows.append((image_name, num_faces))
    if not rows:
        raise ValueError(f"No labeled images found in {labels_path}")
    return rows


def eval_detector(
    name: str,
    detect_fn: Callable[[np.ndarray], List[dict]],
    *,
    print_result: bool = True,
) -> Dict[str, float]:
    """Evaluate face counts using the detector's returned list of detections."""
    rows = _read_detection_labels()
    true_positive = false_positive = false_negative = 0
    elapsed_seconds = 0.0

    for image_name, true_count in rows:
        image = _read_image(_resolve_dataset_image(DETECTION_DIR, image_name))
        started = time.perf_counter()
        detections = detect_fn(image)
        elapsed_seconds += time.perf_counter() - started
        predicted_count = len(detections)
        true_positive += min(predicted_count, true_count)
        false_positive += max(predicted_count - true_count, 0)
        false_negative += max(true_count - predicted_count, 0)

    precision = (
        true_positive / (true_positive + false_positive)
        if true_positive + false_positive
        else 0.0
    )
    recall = (
        true_positive / (true_positive + false_negative)
        if true_positive + false_negative
        else 0.0
    )
    accuracy_denominator = true_positive + false_positive + false_negative
    accuracy = true_positive / accuracy_denominator if accuracy_denominator else 0.0
    f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
    result = {
        "accuracy": accuracy,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "ms_per_image": elapsed_seconds * 1000 / len(rows),
    }
    if print_result:
        _print_detector_table([(name, result)])
    return result


def _print_detector_table(results: List[Tuple[str, Dict[str, float]]]) -> None:
    print("\nDetector evaluation")
    print(
        f"{'Detector':<14} {'Accuracy':>10} {'Precision':>10} {'Recall':>10} "
        f"{'F1':>10} {'ms/image':>12}"
    )
    for name, result in results:
        print(
            f"{name:<14} {result['accuracy']:>9.2%} {result['precision']:>9.2%} "
            f"{result['recall']:>9.2%} {result['f1']:>9.2%} "
            f"{result['ms_per_image']:>11.2f}"
        )


def _make_mediapipe_detector():
    try:
        import mediapipe as mp
    except ImportError as exc:
        raise RuntimeError(
            "MediaPipe is not installed. Install the optional dependency with "
            "'python -m pip install -r requirements-eval.txt'."
        ) from exc

    detector = mp.solutions.face_detection.FaceDetection(
        model_selection=1,
        min_detection_confidence=0.5,
    )

    def detect(image_bgr: np.ndarray):
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        return detector.process(image_rgb).detections or []

    return detector, detect


def _recognition_images() -> List[Tuple[Path, str]]:
    if not RECOGNITION_DIR.is_dir():
        raise FileNotFoundError(
            f"Recognition evaluation folder is missing: {RECOGNITION_DIR}"
        )
    unknown_dir = RECOGNITION_DIR / "unknown"
    if not unknown_dir.is_dir():
        raise FileNotFoundError(
            f"Recognition evaluation requires an 'unknown' folder: {unknown_dir}"
        )

    samples = []
    for class_dir in sorted(path for path in RECOGNITION_DIR.iterdir() if path.is_dir()):
        label = class_dir.name
        if label != "unknown":
            try:
                label = str(int(label))
            except ValueError:
                raise ValueError(
                    "Recognition class folder names must be numeric student profile IDs "
                    "used by the face gallery, or 'unknown': " + str(class_dir)
                )
        for image_path in sorted(class_dir.iterdir()):
            if image_path.is_file() and image_path.suffix.lower() in IMAGE_EXTENSIONS:
                samples.append((image_path, label))
    if not samples:
        raise ValueError(f"No JPG/JPEG evaluation images found in {RECOGNITION_DIR}")
    return samples


def eval_recognition() -> Dict[str, float]:
    """Evaluate one main face per image with the existing recognition pipeline."""
    samples = _recognition_images()
    expected = []
    predicted = []

    for image_path, true_label in samples:
        detections = face_engine.recognize_faces_all(_read_image(image_path))
        if detections:
            # Enrollment also uses the largest detected face when choosing a subject.
            detection = max(
                detections,
                key=lambda item: item["box"][2] * item["box"][3],
            )
            prediction = (
                str(int(detection["student_profile_id"]))
                if detection["matched"]
                else "unknown"
            )
        else:
            prediction = "unknown"
        expected.append(true_label)
        predicted.append(prediction)

    labels = sorted(set(expected) | set(predicted))
    true_counts = Counter(expected)
    predicted_counts = Counter(predicted)
    true_positives = Counter(
        truth for truth, prediction in zip(expected, predicted) if truth == prediction
    )
    precisions = []
    recalls = []
    for label in labels:
        tp = true_positives[label]
        precision_denominator = predicted_counts[label]
        recall_denominator = true_counts[label]
        precisions.append(tp / precision_denominator if precision_denominator else 0.0)
        recalls.append(tp / recall_denominator if recall_denominator else 0.0)

    result = {
        "accuracy": sum(t == p for t, p in zip(expected, predicted)) / len(expected),
        "precision": sum(precisions) / len(precisions) if precisions else 0.0,
        "recall": sum(recalls) / len(recalls) if recalls else 0.0,
    }
    print(
        "Recognition (SCRFD + enrolled recognizer): "
        f"accuracy={result['accuracy']:.2%}, "
        f"macro precision={result['precision']:.2%}, "
        f"macro recall={result['recall']:.2%} "
        f"({len(samples)} images)"
    )
    return result


def run_all() -> None:
    # Validate both datasets before loading either detector/model.
    _read_detection_labels()
    _recognition_images()

    scrfd_result = eval_detector(
        "SCRFD",
        face_engine.detect_faces,
        print_result=False,
    )
    mp_detector, mediapipe_detect = _make_mediapipe_detector()
    try:
        mediapipe_result = eval_detector(
            "MediaPipe",
            mediapipe_detect,
            print_result=False,
        )
    finally:
        mp_detector.close()

    _print_detector_table(
        [("SCRFD", scrfd_result), ("MediaPipe", mediapipe_result)]
    )
    eval_recognition()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Attendify face models")
    parser.parse_args()
    try:
        run_all()
    except (FileNotFoundError, RuntimeError, ValueError) as exc:
        print(f"Evaluation failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
