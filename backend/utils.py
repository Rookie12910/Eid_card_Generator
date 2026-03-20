import os
import uuid
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

def generate_card_image(template_id: int, user_name: str, user_message: str) -> str:
    """
    Generates a card image by overlaying Bangla text.
    Handles complex Bangla text ligatures and shaping using RAQM (built into modern Pillow).
    """
    # 1. Load the correct card template image
    template_path = os.path.join(BASE_DIR, "static", "templates", f"template_{template_id}.png")
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template {template_id} not found at {template_path}.")

    img = Image.open(template_path).convert("RGBA")
    draw = ImageDraw.Draw(img)

    # 2. Load the specific Bangla .ttf font
    font_path = os.path.join(BASE_DIR, "static", "fonts", "kalpurush.ttf")
    
    if not os.path.exists(font_path):
        raise FileNotFoundError(f"Font kalpurush.ttf not found at {font_path}.")
    
    # 3. Correct complex text layout using RAQM layout engine
    # Setting layout_engine=ImageFont.LAYOUT_RAQM is the specialized method 
    # required in Pillow to correctly shape Indic/Bangla ligatures and vowel positions.
    try:
        font_message = ImageFont.truetype(font_path, size=55, layout_engine=ImageFont.LAYOUT_RAQM)
        font_name = ImageFont.truetype(font_path, size=40, layout_engine=ImageFont.LAYOUT_RAQM)
    except Exception:
        # Fallback if the underlying Pillow build lacks RAQM support
        font_message = ImageFont.truetype(font_path, size=55)
        font_name = ImageFont.truetype(font_path, size=40)

    # Image dimensions are 1080x1080
    width, height = img.size
    
    # 4. Place the text on the image with good color and position
    # Get text bounding box for accurate centering
    msg_bbox = draw.textbbox((0, 0), user_message, font=font_message)
    msg_w = msg_bbox[2] - msg_bbox[0]
    msg_x = (width - msg_w) / 2
    msg_y = height * 0.70  # Lower part of the card

    # The user_name goes slightly below it
    name_bbox = draw.textbbox((0, 0), user_name, font=font_name)
    name_w = name_bbox[2] - name_bbox[0]
    name_x = (width - name_w) / 2
    name_y = height * 0.82

    # Draw Text (Gold for message, White/Silver for name)
    draw.text((msg_x, msg_y), user_message, font=font_message, fill=(255, 215, 0, 255))
    draw.text((name_x, name_y), user_name, font=font_name, fill=(255, 255, 255, 255))

    # 5. Save the new image in /backend/static/generated and return URL
    output_dir = os.path.join(BASE_DIR, "static", "generated")
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"generated_{uuid.uuid4().hex}.png"
    output_path = os.path.join(output_dir, filename)
    
    img.save(output_path, "PNG")
    
    return f"/static/generated/{filename}"
