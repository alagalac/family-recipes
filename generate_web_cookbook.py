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
    html.append('<div class="ingredients"><h3>Ingredients</h3><ul>')
    for ing in recipe.get("ingredients", []):
        if ing:
            html.append(f'<li>{html_escape(ing)}</li>')
    html.append('</ul></div>')
    html.append('<div class="instructions"><h3>Instructions</h3><ol>')
    for step in recipe.get("instructions", []):
        if step:
            html.append(f'<li>{html_escape(step)}</li>')
    html.append('</ol></div>')
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
body { font-family: Georgia, serif; margin: 0; padding: 0; background: #f8f8f8; }
h1 { text-align: center; margin-top: 30px; }
.section { page-break-before: always; margin: 40px 0 0 0; }
.recipe { background: #fff; margin: 30px auto 40px auto; padding: 24px 32px; max-width: 800px; border-radius: 8px; box-shadow: 0 2px 8px #ddd; }
.recipe h2 { margin-top: 0; color: #3a3a3a; }
.meta { font-size: 1em; margin-bottom: 10px; color: #666; }
.columns { display: flex; gap: 40px; }
.ingredients, .instructions { flex: 1; }
.ingredients ul, .notes ul { margin: 0; padding-left: 20px; }
.instructions ol { margin: 0; padding-left: 20px; }
.notes { background: #f3f3e6; padding: 10px 16px; border-radius: 6px; margin-top: 18px; }
.commentary { font-style: italic; color: #7a5c2e; margin: 12px 0; }
.attribution { font-size: 0.95em; color: #888; margin-top: 10px; }
@media print {
  body { background: #fff; }
  .recipe { box-shadow: none; page-break-inside: avoid; }
  .section { page-break-before: always; }
    @page {
    margin: 0.3in 1in 0.3in 1in !important
  }
}
</style>
</head>
<body>
<h1>My Family Cookbook</h1>
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
