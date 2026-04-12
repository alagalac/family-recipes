import yaml
import json
import os

def load_structure(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def load_recipe(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        return yaml.safe_load(f)

def generate_recipes_json(structure_file, recipes_folder, output_file):
    cookbook = load_structure(structure_file)
    recipes = []
    
    for section in cookbook['sections']:
        if section.get('recipes'):
            for recipe_name in section['recipes']:
                recipe_file = os.path.join(recipes_folder, f"{recipe_name}.yaml")
                try:
                    recipe = load_recipe(recipe_file)
                    if recipe and recipe.get('title'):  # Only include recipes with titles
                        recipes.append({
                            'id': recipe_name,
                            'title': recipe.get('title', ''),
                            'section': section['name'],
                            'prep_time': recipe.get('prep_time', ''),
                            'cook_time': recipe.get('cook_time', ''),
                            'servings': recipe.get('servings', ''),
                            'commentary': recipe.get('commentary', ''),
                            'ingredients': recipe.get('ingredients', []),
                            'instructions': recipe.get('instructions', []),
                            'notes': recipe.get('notes', []),
                            'attribution': recipe.get('attribution', '')
                        })
                except Exception as e:
                    print(f"Error loading recipe {recipe_file}: {e}")
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(recipes, f, ensure_ascii=False, indent=2)
    
    print(f"Generated {len(recipes)} recipes in {output_file}")

if __name__ == '__main__':
    generate_recipes_json('cookbook_structure.yaml', 'recipes', 'docs/spa/recipes.json')
