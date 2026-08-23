import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def create_og_image(output_path="og-image.jpg"):
    W, H = 1200, 630
    
    # Base canvas
    img = Image.new("RGBA", (W, H), (10, 29, 55, 255))
    draw = ImageDraw.Draw(img)
    
    # Background gradient: Rich deep navy to dark royal blue
    for y in range(H):
        t = y / H
        r = int(9 + (15 - 9) * t)
        g = int(25 + (43 - 25) * t)
        b = int(50 + (84 - 50) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))
    
    # Glowing ambient light effects
    glow_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow_layer)
    # Warm amber glow bottom right
    glow_draw.ellipse([700, 200, 1300, 750], fill=(242, 164, 19, 50))
    # Magenta/Pink glow top left
    glow_draw.ellipse([-80, -80, 360, 360], fill=(216, 27, 122, 40))
    # Cyan/Blue glow top right
    glow_draw.ellipse([800, -100, 1250, 300], fill=(43, 127, 196, 35))
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(90))
    img = Image.alpha_composite(img, glow_layer)
    draw = ImageDraw.Draw(img)
    
    # Subtle modern grid lines
    grid_layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    grid_draw = ImageDraw.Draw(grid_layer)
    for x in range(0, W, 50):
        grid_draw.line([(x, 0), (x, H)], fill=(255, 255, 255, 9), width=1)
    for y in range(0, H, 50):
        grid_draw.line([(0, y), (W, y)], fill=(255, 255, 255, 9), width=1)
    img = Image.alpha_composite(img, grid_layer)
    draw = ImageDraw.Draw(img)

    # Fonts
    font_bold = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg = "C:/Windows/Fonts/segoeui.ttf"
    font_semib = "C:/Windows/Fonts/seguisb.ttf"
    if not os.path.exists(font_bold):
        font_bold = "C:/Windows/Fonts/arialbd.ttf"
        font_reg = "C:/Windows/Fonts/arial.ttf"
        font_semib = font_bold

    font_brand = ImageFont.truetype(font_bold, 38)
    font_badge = ImageFont.truetype(font_bold, 14)
    font_h1 = ImageFont.truetype(font_bold, 48)
    font_sub = ImageFont.truetype(font_semib, 20)
    font_bullet = ImageFont.truetype(font_semib, 17)
    font_pill_k = ImageFont.truetype(font_bold, 12)
    font_pill_v = ImageFont.truetype(font_bold, 19)
    font_btn = ImageFont.truetype(font_bold, 17)
    font_float_t = ImageFont.truetype(font_bold, 14)
    font_float_s = ImageFont.truetype(font_semib, 12)

    # 1. Logo & Brand Mark (Top Left)
    logo_path = "logo-clean.png"
    if os.path.exists(logo_path):
        try:
            logo_img = Image.open(logo_path).convert("RGBA")
            logo_img.thumbnail((50, 50), Image.Resampling.LANCZOS)
            img.paste(logo_img, (68, 52), logo_img)
            draw.text((130, 54), "CJpy", font=font_brand, fill=(255, 255, 255, 255))
        except Exception:
            draw.text((68, 54), "CJpy", font=font_brand, fill=(255, 255, 255, 255))
    else:
        draw.text((68, 54), "CJpy", font=font_brand, fill=(255, 255, 255, 255))

    # Cohort 02 Badge (Pill)
    badge_x = 246
    badge_y = 56
    badge_w = 150
    badge_h = 36
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], radius=18, fill=(13, 43, 78, 220), outline=(242, 164, 19, 180), width=1)
    
    # 3 Accent dots inside badge
    draw.ellipse([badge_x + 14, badge_y + 14, badge_x + 22, badge_y + 22], fill=(216, 27, 122, 255))
    draw.ellipse([badge_x + 25, badge_y + 14, badge_x + 33, badge_y + 22], fill=(43, 127, 196, 255))
    draw.ellipse([badge_x + 36, badge_y + 14, badge_x + 44, badge_y + 22], fill=(242, 164, 19, 255))
    draw.text((badge_x + 52, badge_y + 8), "COHORT 02", font=font_badge, fill=(255, 255, 255, 255))

    # 2. Main Headline
    draw.text((68, 126), "Learn today.", font=font_h1, fill=(255, 255, 255, 255))
    draw.text((68, 182), "Build tomorrow.", font=font_h1, fill=(255, 255, 255, 255))
    draw.text((68, 238), "Lead forever.", font=font_h1, fill=(242, 164, 19, 255)) # Amber accent

    # 3. Subtitle
    draw.text((68, 316), "30-Day Intensive Python Bootcamp for Beginners in Ghana", font=font_sub, fill=(225, 235, 248, 255))

    # Bullet points with clean drawn checkmark icons
    bullets = [
        "Live interactive Zoom sessions + Breakout rooms (20 max)",
        "Dedicated 1-on-1 mentor guidance on WhatsApp",
        "Build real automation scripts, tools & portfolio projects"
    ]
    by = 368
    for text in bullets:
        # Check circle
        draw.ellipse([68, by + 1, 88, by + 21], fill=(242, 164, 19, 255))
        # Draw checkmark lines
        draw.line([(73, by + 11), (77, by + 15)], fill=(13, 43, 78, 255), width=2)
        draw.line([(77, by + 15), (84, by + 7)], fill=(13, 43, 78, 255), width=2)
        draw.text((98, by + 1), text, font=font_bullet, fill=(238, 242, 248, 255))
        by += 36

    # 4. Bottom Info Pill & CTA
    cta_y = 508
    # Left pill: Tuition & Date
    draw.rounded_rectangle([68, cta_y, 440, cta_y + 64], radius=14, fill=(255, 255, 255, 255), outline=(227, 231, 238, 255), width=1)
    
    draw.text((86, cta_y + 12), "TUITION", font=font_pill_k, fill=(100, 115, 135, 255))
    draw.text((86, cta_y + 28), "GH₵ 300", font=font_pill_v, fill=(13, 43, 78, 255))
    
    draw.line([(210, cta_y + 14), (210, cta_y + 50)], fill=(207, 214, 226, 255), width=1)
    
    draw.text((228, cta_y + 12), "STARTS", font=font_pill_k, fill=(100, 115, 135, 255))
    draw.text((228, cta_y + 28), "Sept 10, 2026", font=font_pill_v, fill=(216, 27, 122, 255))

    # CTA Button
    btn_x, btn_w = 458, 212
    draw.rounded_rectangle([btn_x, cta_y, btn_x + btn_w, cta_y + 64], radius=14, fill=(242, 164, 19, 255))
    draw.text((btn_x + 22, cta_y + 20), "joincjpy.com", font=font_btn, fill=(13, 43, 78, 255))
    # Arrow circle inside button
    arrow_cx, arrow_cy = btn_x + btn_w - 32, cta_y + 32
    draw.ellipse([arrow_cx - 14, arrow_cy - 14, arrow_cx + 14, arrow_cy + 14], fill=(13, 43, 78, 255))
    draw.line([(arrow_cx - 5, arrow_cy), (arrow_cx + 5, arrow_cy)], fill=(255, 255, 255, 255), width=2)
    draw.line([(arrow_cx + 1, arrow_cy - 4), (arrow_cx + 5, arrow_cy)], fill=(255, 255, 255, 255), width=2)
    draw.line([(arrow_cx + 1, arrow_cy + 4), (arrow_cx + 5, arrow_cy)], fill=(255, 255, 255, 255), width=2)

    # 5. Right Side: Hero Image Showcase Card
    hero_path = "hero.jpg"
    if os.path.exists(hero_path):
        try:
            hero_raw = Image.open(hero_path).convert("RGBA")
            card_w, card_h = 440, 430
            card_x, card_y = 692, 95
            
            hero_resized = hero_raw.resize((card_w, card_h), Image.Resampling.LANCZOS)
            
            # Mask for card
            mask = Image.new("L", (card_w, card_h), 0)
            mask_draw = ImageDraw.Draw(mask)
            mask_draw.rounded_rectangle([0, 0, card_w, card_h], radius=24, fill=255)
            
            # Glowing border background
            card_bg = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            card_bg_draw = ImageDraw.Draw(card_bg)
            card_bg_draw.rounded_rectangle([card_x - 3, card_y - 3, card_x + card_w + 3, card_y + card_h + 3], radius=27, outline=(242, 164, 19, 160), width=3)
            
            img = Image.alpha_composite(img, card_bg)
            img.paste(hero_resized, (card_x, card_y), mask)
            draw = ImageDraw.Draw(img)
            
            # Floating Grad Badge on photo
            float_w, float_h = 240, 66
            float_x = card_x + card_w - float_w - 18
            float_y = card_y + card_h - float_h - 18
            
            float_overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            fo_draw = ImageDraw.Draw(float_overlay)
            fo_draw.rounded_rectangle([float_x, float_y, float_x + float_w, float_y + float_h], radius=14, fill=(13, 43, 78, 240), outline=(255, 255, 255, 70), width=1)
            img = Image.alpha_composite(img, float_overlay)
            draw = ImageDraw.Draw(img)
            
            draw.text((float_x + 16, float_y + 12), "65+ Grads in Cohort 01", font=font_float_t, fill=(255, 255, 255, 255))
            
            # Draw 5 gold stars cleanly
            star_x = float_x + 16
            star_y = float_y + 36
            for s in range(5):
                # Star circle
                draw.ellipse([star_x + s * 14, star_y, star_x + s * 14 + 10, star_y + 10], fill=(242, 164, 19, 255))
            draw.text((star_x + 78, star_y - 1), "Top Rated Bootcamp", font=font_float_s, fill=(242, 164, 19, 255))

        except Exception as e:
            print("Error rendering hero card:", e)

    # Save output
    rgb_img = img.convert("RGB")
    rgb_img.save(output_path, quality=95)
    rgb_img.save("og-image.png")
    print(f"Generated {output_path} and og-image.png successfully!")

if __name__ == "__main__":
    create_og_image()
