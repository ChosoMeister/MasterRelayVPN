from PIL import Image, ImageDraw

# Create a 512x512 transparent image
size = 512
img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Colors matching the brand
accent_color = (59, 130, 246, 255) # #3b82f6

# Draw a shield (simplified version of the SVG)
# The SVG is M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z on a 24x24 canvas
# Let's scale it to 512x512
scale = 512 / 24
# Points:
# Top center: 12, 2 -> 256, 42
# Top right: 20, 5 -> 426, 106
# Bottom right start curve: 20, 12 -> 426, 256
# Bottom center: 12, 22 -> 256, 469
# Bottom left start curve: 4, 12 -> 85, 256
# Top left: 4, 5 -> 85, 106

points = [
    (256, 42),   # Top Center
    (426, 106),  # Top Right
    (426, 256),  # Right Edge down
    (256, 469),  # Bottom Center
    (85, 256),   # Left Edge down
    (85, 106),   # Top Left
]

# We can draw it as a polygon for a solid shield, then maybe a stroke
draw.polygon(points, fill=accent_color)

# Draw a white inner shield or something
draw.polygon([
    (256, 85),
    (384, 135),
    (384, 256),
    (256, 426),
    (128, 256),
    (128, 135)
], fill=(255, 255, 255, 255))

# Save PNG
img.save("assets/icon.png")

# Save ICO
img.save("assets/icon.ico", format="ICO", sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
print("Generated icon.png and icon.ico")
