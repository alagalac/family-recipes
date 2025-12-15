import yaml
import os

def load_structure(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def load_recipe(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def html_escape(text):
    import html
    return html.escape(str(text)) if text else ""

def render_recipe(recipe, recipe_id):
    html = []
    html.append(f'<div class="recipe" id="{recipe_id}">')
    html.append(f'<h2>{html_escape(recipe.get("title", ""))}</h2>')
    if recipe.get("commentary"):
        html.append(f'<blockquote class="commentary">{html_escape(recipe["commentary"])}</blockquote>')
    html.append(f'<div class="meta"><strong>Prep Time:</strong> {html_escape(recipe.get("prep_time", ""))} | <strong>Cook Time:</strong> {html_escape(recipe.get("cook_time", ""))} | <strong>Servings:</strong> {html_escape(recipe.get("servings", ""))}</div>')
    html.append('<div class="columns">')
    # Ingredients block with subheading support
    html.append('<div class="ingredients"><h3>Ingredients</h3>')
    ingredients = recipe.get("ingredients", [])
    if isinstance(ingredients, dict):
        for subheading, items in ingredients.items():
            html.append(f'<h4>{html_escape(subheading)}</h4>')
            html.append('<ul>')
            for ing in items:
                if ing:
                    html.append(f'<li>{html_escape(ing)}</li>')
            html.append('</ul>')
    else:
        html.append('<ul>')
        for ing in ingredients:
            if ing:
                html.append(f'<li>{html_escape(ing)}</li>')
        html.append('</ul>')
    html.append('</div>')

    # Instructions block with subheading support
    html.append('<div class="instructions"><h3>Instructions</h3>')
    instructions = recipe.get("instructions", [])
    if isinstance(instructions, dict):
      for subheading, steps in instructions.items():
        html.append(f'<h4>{html_escape(subheading)}</h4>')
        html.append('<ol>')
        for i, step in enumerate(steps, start=1):
          if step:
            html.append(f'<li>{html_escape(step)}</li>')
        html.append('</ol>')
    else:
        html.append('<ol>')
        for step in instructions:
            if step:
                html.append(f'<li>{html_escape(step)}</li>')
        html.append('</ol>')
    html.append('</div>')
    html.append('</div>')
    notes = recipe.get("notes")
    if notes:
        html.append('<div class="notes"><h4>Notes</h4>')
        if isinstance(notes, list):
            html.append('<ul>')
            for note in notes:
                html.append(f'<li>{html_escape(note)}</li>')
            html.append('</ul>')
        else:
            html.append(f'<p>{html_escape(notes)}</p>')
        html.append('</div>')
    if recipe.get("attribution"):
        html.append(f'<div class="attribution">Attribution: {html_escape(recipe["attribution"])}</div>')
    html.append('</div>')
    return "\n".join(html)

def generate_html_cookbook(structure_file, recipes_folder, output_file):
    cookbook = load_structure(structure_file)
    html = []
    html.append("""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#2c3e50">
<meta name="description" content="Family Recipe Cookbook">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<title>My Family Cookbook</title>
<link rel="stylesheet" href="styles.css">
<link rel="manifest" href="manifest.json">
<link rel="icon" type="image/png" sizes="192x192" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%232c3e50' width='192' height='192'/><text x='50%' y='50%' font-size='120' font-family='Georgia' fill='%23ecf0f1' text-anchor='middle' dominant-baseline='middle'>📖</text></svg>">
<link rel="apple-touch-icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%232c3e50' width='192' height='192'/><text x='50%' y='50%' font-size='120' font-family='Georgia' fill='%23ecf0f1' text-anchor='middle' dominant-baseline='middle'>📖</text></svg>">
</head>
<body>
<div id="header-bar">
  <div class="header-content">
    <h1 class="header-title">📖 Cookbook</h1>
    <div class="header-controls">
      <div class="search-container">
        <input type="text" id="recipe-search" class="search-input" placeholder="Search recipes..." aria-label="Search recipes">
        <button id="search-clear-btn" class="search-clear-btn" aria-label="Clear search" style="display:none;">✕</button>
      </div>
      <button id="cooking-mode-btn" class="cooking-mode-btn" title="Toggle cooking mode" aria-label="Toggle cooking mode"><span class="btn-icon">🔆</span><span class="btn-text"> Cooking Mode</span></button>
      <button id="menu-toggle-btn" class="menu-toggle-btn" aria-label="Toggle menu" aria-expanded="false">☰</button>
    </div>
  </div>
</div>
<div id="nav-drawer" class="nav-drawer"></div>
""")
    
    # Build recipes data for search
    html.append('<script id="recipes-data" type="application/json">')
    recipes_data = []
    for section in cookbook['sections']:
        if section.get('recipes'):
            for recipe_name in section['recipes']:
                recipe_file = os.path.join(recipes_folder, f"{recipe_name}.yaml")
                if os.path.exists(recipe_file):
                    recipe = load_recipe(recipe_file)
                    title = recipe.get("title", recipe_name)
                    recipe_id = recipe_name.lower().replace(' ', '-')
                    ingredients_str = ""
                    ingredients = recipe.get("ingredients", [])
                    if isinstance(ingredients, dict):
                        for subheading, items in ingredients.items():
                            if items:
                                ingredients_str += " ".join([str(ing) for ing in items if ing]) + " "
                    else:
                        ingredients_str = " ".join([str(ing) for ing in ingredients if ing])
                    recipes_data.append({
                        "id": recipe_id,
                        "title": title,
                        "section": section["name"],
                        "ingredients": ingredients_str
                    })
    import json
    html.append(json.dumps(recipes_data))
    html.append('</script>')
    
    # Navigation drawer
    html.append('<nav class="recipe-nav">')
    for section in cookbook['sections']:
        html.append(f'<h3>{html_escape(section["name"])}</h3>')
        html.append('<ul>')
        if section.get('recipes'):
            for recipe_name in section['recipes']:
                recipe_file = os.path.join(recipes_folder, f"{recipe_name}.yaml")
                if os.path.exists(recipe_file):
                    recipe = load_recipe(recipe_file)
                    title = recipe.get("title", recipe_name)
                    # Create a sanitized id for the anchor
                    recipe_id = recipe_name.lower().replace(' ', '-')
                    html.append(f'<li><a href="#{recipe_id}">{html_escape(title)}</a></li>')
        html.append('</ul>')
    html.append('</nav>')
    
    # Main content
    html.append('<main>')
    html.append('<h1>My Cookbook</h1>')
    
    for section in cookbook['sections']:
        html.append(f'<div class="section"><h1>{html_escape(section["name"])}</h1>')
        if not section.get('recipes'):
            html.append('<p><em>No recipes in this section.</em></p></div>')
            continue
        for recipe_name in section['recipes']:
            recipe_file = os.path.join(recipes_folder, f"{recipe_name}.yaml")
            if not os.path.exists(recipe_file):
                html.append(f'<div class="recipe"><h2>{html_escape(recipe_name)}</h2><p><em>Recipe file not found.</em></p></div>')
                continue
            recipe = load_recipe(recipe_file)
            recipe_id = recipe_name.lower().replace(' ', '-')
            html.append(render_recipe(recipe, recipe_id))
        html.append('</div>')
    html.append('</main>')
    html.append("""
<script src="app.js"></script>
</body></html>""")
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(html))

if __name__ == "__main__":
    structure_file = "cookbook_structure.yaml"
    recipes_folder = "./recipes"
    output_file = "./docs/index.html"
    generate_html_cookbook(structure_file, recipes_folder, output_file)
    print(f"Cookbook HTML generated: {output_file}")
