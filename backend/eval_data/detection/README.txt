Detection evaluation data

Put labeled JPG/JPEG images in this folder (subfolders are allowed). Create a
labels.csv file here with this exact header:

image,num_faces
classroom_01.jpg,10
frames/frame_02.jpg,12

The image value is a path relative to this folder. num_faces is the verified
number of faces visible in that image. Each row should refer to one readable
image. Dataset images and labels are local evaluation data and are gitignored.

Detector "accuracy" uses TP / (TP + FP + FN), where face counts are compared
per image; precision, recall, F1, and average detector time are also printed.
