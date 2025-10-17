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

def render_recipe(recipe):
    html = []
    html.append(f'<div class="recipe">')
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
    html.append("""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>My Family Cookbook</title>
<style>
body {
  font-family: Georgia, serif;
  margin: 0;
  padding: 0;
  background: #f8f8f8;
  color: #222;
}
h1, h2, h3, h4 {
  font-family: 'Segoe UI', Arial, sans-serif;
}
h1 {
  text-align: center;
  margin-top: 30px;
  font-size: 2.5em;
  letter-spacing: 1px;
}
.section {
  page-break-before: always;
  margin: 60px 0 0 0;
  border-top: 2px solid #e0e0e0;
  padding-top: 30px;
}
.recipe {
  background: #fff;
  margin: 30px auto 40px auto;
  padding: 28px 36px;
  max-width: 800px;
  border-radius: 10px;
  box-shadow: 0 4px 24px #e0e0e0;
}
.recipe h2 {
  margin-top: 0;
  color: #3a3a3a;
  font-size: 2em;
}
.meta {
  font-size: 1em;
  margin-bottom: 14px;
  color: #666;
}
.columns {
  display: flex;
  gap: 40px;
  margin-bottom: 10px;
}
.ingredients, .instructions {
  flex: 1;
  background: #f6f8fa;
  border-radius: 6px;
  padding: 12px 18px;
  box-sizing: border-box;
}
.ingredients ul, .notes ul {
  margin: 0;
  padding-left: 20px;
}
.instructions ol {
  margin: 0;
  padding-left: 20px;
}
.notes {
  background: #f3f3e6;
  padding: 12px 18px;
  border-radius: 6px;
  margin-top: 18px;
  font-size: 1em;
}
.commentary {
  font-style: italic;
  color: #7a5c2e;
  margin: 12px 0;
  background: #fffbe8;
  border-left: 4px solid #ffe08a;
  padding: 8px 16px;
  border-radius: 4px;
}
.attribution {
  font-size: 0.95em;
  color: #888;
  margin-top: 10px;
}
@media (max-width: 700px) {
  .columns {
    flex-direction: column;
    gap: 0;
  }
  .recipe {
    padding: 16px 6vw;
  }
}
@media print {
  body { background: #fff; color: #000; }
  .recipe { box-shadow: none; page-break-inside: avoid; }
  .section { page-break-before: always; border: none; padding-top: 0; }
  a, a:visited { color: #000; text-decoration: none; }
  @page {
    margin: 0.3in 1in 0.3in 1in !important;
  }
}
</style>
</head>
<body>
<h1>My Cookbook</h1>
""")
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
            html.append(render_recipe(recipe))
        html.append('</div>')
    html.append('</body></html>')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(html))

if __name__ == "__main__":
    structure_file = "cookbook_structure.yaml"
    recipes_folder = "./recipes"
    output_file = "cookbook_printable.html"
    generate_html_cookbook(structure_file, recipes_folder, output_file)
    print(f"Cookbook HTML generated: {output_file}")
