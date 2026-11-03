Recognition evaluation data

Create one folder per known student, using that student's numeric
student_profile_id (the ID stored in the face gallery), and a folder named
"unknown" for people who are not enrolled. Put JPG/JPEG images directly in
each folder. Use images that were not used to enroll those students.

Example:
  recognition/
    12/
      test_01.jpg
    27/
      test_02.jpg
    unknown/
      visitor_01.jpg

Use one primary face per image. If an image contains multiple faces, the
largest detected face is evaluated. A missed face is predicted as "unknown".
The tool reports overall accuracy and macro-averaged precision and recall.
Evaluation images are local and gitignored.
