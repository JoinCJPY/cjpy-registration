import os
from PIL import Image

def create_logo_og_image(output_path="og-image.jpg"):
    W, H = 1200, 630
    
    # 1. Clean pure white background (#ffffff) - No black background
    canvas = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    
    if os.path.exists("logo-clean.png"):
        logo = Image.open("logo-clean.png").convert("RGBA")
        
        # Scale logo nicely centered on the white canvas
        target_h = int(H * 0.78)  # ~490px tall
        aspect = logo.width / logo.height
        target_w = int(target_h * aspect)
        
        if target_w > int(W * 0.85):
            target_w = int(W * 0.85)
            target_h = int(target_w / aspect)
            
        logo_resized = logo.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Center horizontally and vertically
        pos_x = (W - target_w) // 2
        pos_y = (H - target_h) // 2
        
        canvas.paste(logo_resized, (pos_x, pos_y), logo_resized)
        
    # Save as clean RGB JPG and PNG
    rgb_img = canvas.convert("RGB")
    rgb_img.save(output_path, quality=95)
    canvas.save("og-image.png")
    print(f"Created clean white background {output_path} and og-image.png successfully!")

if __name__ == "__main__":
    create_logo_og_image()
