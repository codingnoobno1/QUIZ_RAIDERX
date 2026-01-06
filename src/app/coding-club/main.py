import cv2
import threading
import time
import math
from fastapi import FastAPI
from fastapi.responses import StreamingResponse, JSONResponse
from ultralytics import YOLO
from deep_sort_realtime.deepsort_tracker import DeepSort

# FastAPI app
app = FastAPI()

# Load YOLOv8n model
model = YOLO("yolov8n.pt")
vehicle_ids = [2, 3, 5, 7]  # car, motorcycle, bus, truck

# DeepSORT tracker
tracker = DeepSort(max_age=30)

# Initialize webcam
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

# Shared resources
frame_lock = threading.Lock()
latest_frame = None
latest_count = 0
object_speeds = {}

# Speed calculation helpers
previous_centroids = {}
pixels_per_meter = 8  # Manually approximated, adjust for real cam

def estimate_speed(obj_id, centroid, timestamp):
    if obj_id in previous_centroids:
        prev_centroid, prev_time = previous_centroids[obj_id]
        dist_pixels = math.hypot(centroid[0] - prev_centroid[0], centroid[1] - prev_centroid[1])
        dist_meters = dist_pixels / pixels_per_meter
        time_diff = timestamp - prev_time
        if time_diff > 0:
            speed_mps = dist_meters / time_diff
            speed_kmph = speed_mps * 3.6
            return round(speed_kmph, 1)
    return None

def capture_loop():
    global latest_frame, latest_count, object_speeds
    while True:
        ret, frame = cap.read()
        if not ret:
            continue

        frame = cv2.resize(frame, (640, 480), interpolation=cv2.INTER_AREA)
        results = model(frame, verbose=False, imgsz=640)[0]

        detections = []
        car_count = 0

        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id in vehicle_ids:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                conf = float(box.conf[0])
                detections.append(([x1, y1, x2 - x1, y2 - y1], conf, cls_id))

        tracks = tracker.update_tracks(detections, frame=frame)
        timestamp = time.time()

        for track in tracks:
            if not track.is_confirmed():
                continue

            track_id = track.track_id
            ltrb = track.to_ltrb()
            x1, y1, x2, y2 = map(int, ltrb)
            centroid = ((x1 + x2) // 2, (y1 + y2) // 2)
            cls_id = track.det_class

            speed = estimate_speed(track_id, centroid, timestamp)
            if speed:
                object_speeds[track_id] = speed
            previous_centroids[track_id] = (centroid, timestamp)

            label = f"ID {track_id} | {model.names[cls_id]}"
            if speed:
                label += f" | {speed:.1f} km/h"

            if cls_id == 2:
                car_count += 1

            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        cv2.putText(frame, f"Cars detected: {car_count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)

        with frame_lock:
            latest_frame = frame.copy()
            latest_count = car_count

        time.sleep(0.05)  # ~20 FPS

@app.on_event("startup")
def start_camera_thread():
    threading.Thread(target=capture_loop, daemon=True).start()

@app.on_event("shutdown")
def release_camera():
    cap.release()

@app.get("/count")
def get_car_count():
    return JSONResponse(content={"cars_detected": latest_count})

@app.get("/speeds")
def get_vehicle_speeds():
    with frame_lock:
        return JSONResponse(content={"vehicle_speeds_kmph": object_speeds})

@app.get("/frame")
def get_latest_frame():
    with frame_lock:
        if latest_frame is None:
            return JSONResponse(content={"error": "No frame available"}, status_code=503)
        _, buffer = cv2.imencode(".jpg", latest_frame)
    return StreamingResponse(iter([buffer.tobytes()]), media_type="image/jpeg")

@app.get("/video_feed")
def video_feed():
    def generate():
        while True:
            with frame_lock:
                if latest_frame is None:
                    continue
                _, buffer = cv2.imencode(".jpg", latest_frame)
                frame_bytes = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
            time.sleep(0.05)
    return StreamingResponse(generate(), media_type="multipart/x-mixed-replace; boundary=frame")
