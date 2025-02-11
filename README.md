````plaintext
  ███████   ███████    ███████   ███████
 ██        ██     ██  ██        ██     ██
 ██        ██     ██  ██        ██     ██
 ██        ██     ██  ██        ██     ██
  ███████   ███████    ███████   ███████


# Introduction

Coco Annotations is an intuitive image annotation tool designed for creating and managing
datasets in the COCO format on the go. Whether you're working on object detection,
segmentation, or other computer vision tasks, this tool streamlines the annotation
process and ensures compatibility with industry-standard datasets.

With an easy-to-use interface, Coco Annotations enables users to efficiently label images,
manage datasets, and export structured annotations. It supports bounding boxes, polygons,
and segmentation masks, ensuring flexibility for different machine learning applications.

## Installation

1. Clone this repository

2. Install dependecies

```bash
npm install # or use yarn: yarn install
```

3. Run build

```bash
npm run build
npm run preview #or
npm run preview -- --host # To expose on local network for mobile use
```

This will generate an optimized build and serve it locally.
To test the tool on a mobile device, access it using your local network IP.

4. Run Dev

Use this mode if you plan to make modifications and need hot-reloading.

```bash
npm run dev #or
npm run dev -- --host # To expose on local network for mobile use
```

## How to Use

1. **Initialize Dataset**
   Create a Dataset with required info.

2. **Upload images**
   Add images to the workspace for annotation.

3. **Add Categories**
   Before starting annotating, create at least one category.

4. **Annotate objects**
   Use polygons or segmentation masks to label objects.

5. **Manage datasets**
   Organize and edit annotations directly within the interface.

6. **Export in COCO format**
   Save annotations as a COCO JSON file for machine learning pipelines.

## Technologies

Built using modern web technologies optimized for performance and flexibility.

### Core Stack

- **Frontend:** React, Tailwind CSS,
- **State Management:** Zustand
- **UI Components:** Shadcn/ui, Radix UI, Lucide Icons
- **Form Handling:** React Hook Form, Zod
- **Animation:** Framer Motion
- **Canvas Rendering:** Fabric.js
- **Routing:** React Router DOM

### Development Tools

- **Build System:** Vite
- **Linting:** ESLint
- **Type Checking:** TypeScript
- **CSS Processing:** PostCSS, Tailwind Merge

This stack ensures an efficient, scalable, and maintainable annotation tool.

## Contact

For more information or to get in touch, please visit my website:

[brunomarques.dev](https://brunomarques.dev)
````
