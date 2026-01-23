#!/usr/bin/env python3
"""
Script to separate circles and background from an image
"""
from PIL import Image, ImageDraw
import numpy as np

# Load the image
img_path = "assets/images/background_portrait.jpg"
img = Image.open(img_path)
img_array = np.array(img)

# Create a copy for the background (we'll paint over the circles)
background_img = img.copy()
draw_bg = ImageDraw.Draw(background_img)

# Create an image for circles only (transparent background)
circles_img = Image.new('RGBA', img.size, (0, 0, 0, 0))
draw_circles = ImageDraw.Draw(circles_img)

# Convert original to grayscale to detect circles
gray = img.convert('L')
gray_array = np.array(gray)

# Find bright edges (the circles appear as lighter gray rings)
# We'll use edge detection approach
from scipy import ndimage

# Apply edge detection
edges = ndimage.sobel(gray_array)
edges = (edges / edges.max() * 255).astype(np.uint8)

# Threshold to get strong edges
threshold = 30
edge_mask = edges > threshold

# Create RGBA image for circles with transparency
circles_rgba = np.zeros((*img_array.shape[:2], 4), dtype=np.uint8)
# Copy the original image data where edges exist
for i in range(3):
    circles_rgba[:, :, i] = np.where(edge_mask, img_array[:, :, i], 0)
# Set alpha channel - opaque where edges exist, transparent elsewhere
circles_rgba[:, :, 3] = np.where(edge_mask, 255, 0)

# Enhance the circle detection by finding circular patterns
# Use morphological operations to thicken the detected edges
from scipy.ndimage import binary_dilation

# Dilate the edge mask to capture the full circle rings
struct = np.ones((5, 5))
edge_mask_dilated = binary_dilation(edge_mask, structure=struct, iterations=2)

# Update circles with dilated mask
circles_rgba = np.zeros((*img_array.shape[:2], 4), dtype=np.uint8)
for i in range(3):
    circles_rgba[:, :, i] = np.where(edge_mask_dilated, img_array[:, :, i], 0)
circles_rgba[:, :, 3] = np.where(edge_mask_dilated, 255, 0)

circles_img = Image.fromarray(circles_rgba, 'RGBA')

# For background, use inpainting-like approach to fill in the circle areas
# Simple approach: blur the areas where circles were
background_array = img_array.copy()

# Create a mask for inpainting (where circles are)
mask_for_inpaint = edge_mask_dilated.astype(np.uint8) * 255

# Use a simple approach: for each pixel in circle, replace with nearby background pixels
# We'll use Gaussian blur on the circle regions
from scipy.ndimage import gaussian_filter

for i in range(3):
    blurred_channel = gaussian_filter(img_array[:, :, i].astype(float), sigma=10)
    background_array[:, :, i] = np.where(edge_mask_dilated, blurred_channel, img_array[:, :, i])

background_img = Image.fromarray(background_array)

# Save the results
circles_img.save("assets/images/circle.png")
background_img.save("assets/images/background.png")

print("✓ Created circle.png")
print("✓ Created background.png")
