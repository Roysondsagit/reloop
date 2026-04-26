# ReLoop: Architecture & Technical Explanation
*A Comprehensive Guide for Academic Presentation*

This document breaks down the ReLoop project into two major halves: the **Machine Learning Pipeline (The AI Brain)** and the **AWS Cloud Infrastructure (The Cloud Backbone)**. 

For each component, we explain **What** it is, **Why** we used it, and **How** it works in our project.

---

## Part 1: The Machine Learning Pipeline

### 1. YOLO (You Only Look Once) & TACO Dataset
* **What is it?** YOLO is a state-of-the-art real-time object detection AI. The TACO (Trash Annotations in Context) dataset is a specialized dataset used to train AI to recognize garbage in real-world environments.
* **Why did we use it?** Standard AI models are good at recognizing dogs and cars, but terrible at recognizing crumpled plastic bottles or half-buried cans. YOLO trained on TACO-like data allows our app to instantly draw "bounding boxes" around waste items in milliseconds.
* **How does it work?** When a user scans an image, YOLO acts as the "Eyes". It scans the image grid, detects objects, and isolates them by cropping out the background so the rest of the AI pipeline isn't confused by background noise.

### 2. SigLIP (Classification Agent)
* **What is it?** SigLIP is an advanced vision-language model created by Google that perfectly aligns images with text labels.
* **Why did we use it?** While YOLO detects *where* an object is, SigLIP acts as the "Brain" to determine *exactly what* it is.
* **How does it work?** We feed the cropped images from YOLO into SigLIP. SigLIP compares the image against a list of known materials (e.g., "White Milk Pouch", "Aluminium Can") and returns a classification with a confidence score (e.g., 94% confident).

### 3. Florence-2 & Text Embeddings (FastEmbed)
* **What is it?** Florence-2 is a vision model for deep captioning, and FastEmbed (using `bge-small-en`) is an NLP (Natural Language Processing) model that converts text into math.
* **Why did we use it?** To bridge the gap between "Images" and "Database Searching". Databases can't search images, but they can search math.
* **How does it work?** When the AI classifies an object as an "Aluminium Can", the Embedding model converts the text "Aluminium Can" into a Vector (an array of 384 numbers). This mathematical vector is what we use to search the database.

---

## Part 2: The Vector Database (Matchmaking)

### Qdrant Cloud
* **What is it?** Qdrant is a Vector Search Engine. Unlike traditional SQL databases that match exact text, Qdrant matches mathematical similarity.
* **Why did we use it?** Industrial Symbiosis requires connecting Supply and Demand. A factory might upload a PDF asking for "Scrap Metal", while a waste picker scans an "Aluminium Can". A traditional database would fail to connect these because the words don't match. Qdrant understands that both mean the same thing.
* **How does it work?** 
  1. The **Market Agent** reads factory PDFs, converts their material needs into 384-number Vectors, and saves them in Qdrant.
  2. The **Urban Miner** (Scanner) converts the scanned waste item into a Vector.
  3. Qdrant instantly calculates the mathematical distance between the two vectors. If they are close, it declares a Match and connects the waste picker to the factory.

---

## Part 3: AWS Cloud Infrastructure

### 1. Amazon S3 (Simple Storage Service)
* **What is it?** A highly scalable cloud storage service. Think of it as an infinite hard drive in the cloud.
* **Why did we use it?** Images and PDFs are massive files. If we stored them locally on our backend server, the server would quickly run out of space and crash. 
* **How does it work?** When a user uploads a PDF manifest or scans an image, our backend immediately uploads it to our S3 Bucket (`reloop-waste-uploads`). The backend then deletes the local file and only keeps the secure S3 URL link. This keeps our app lightning fast and lightweight.

### 2. Amazon SNS (Simple Notification Service)
* **What is it?** A Pub/Sub (Publisher/Subscriber) messaging service. It acts like a digital megaphone.
* **Why did we use it?** We needed an event-driven architecture to alert the system when critical things happen—specifically when **Hazardous Waste** (like medical waste) is detected, without slowing down the main user app.
* **How does it work?** If the AI detects Hazardous waste, the backend "Publishes" a message to an SNS Topic (`reloop-alerts`). SNS then broadcasts this message to any system listening to it, ensuring safety protocols are triggered instantly.

### 3. AWS Lambda (Serverless Computing)
* **What is it?** A service that runs code automatically in response to events, without needing a dedicated server running 24/7.
* **Why did we use it?** We offloaded heavy background tasks to Lambda so our main FastAPI server doesn't freeze.
* **How does it work?** Lambda is "Subscribed" to our SNS topic. When SNS yells "Hazardous Waste Detected!", Lambda instantly wakes up, processes the alert, logs the data, and can send out emergency emails/SMS to facility managers—all completely independent of our main backend server.

### 4. AWS IAM (Identity and Access Management)
* **What is it?** The security bouncer of AWS. It controls exactly who and what can access cloud resources.
* **Why did we use it?** Security is critical in production. If we used root access keys in our code, a hacker could take over our entire AWS account.
* **How does it work?** We created a dedicated IAM User (`reloop-app-user`) with a strict "Least-Privilege Policy". This policy states: *"This user is ONLY allowed to upload files to the ReLoop S3 bucket, and publish to the ReLoop SNS topic. They are blocked from doing absolutely anything else."* We securely stored these credentials in our `.env` file.

---

## Summary of the Complete Flow:
1. User scans waste → Image uploaded to **S3**.
2. **YOLO** isolates the trash → **SigLIP** classifies it.
3. Classification is converted to a **Vector**.
4. Vector is mathematically matched against factory buyers in **Qdrant**.
5. If the waste is Hazardous, **SNS** publishes an alert.
6. **Lambda** receives the alert and handles emergency logging in the background.
7. The user sees the perfect buyer on their screen!
