import yaml
import os
import glob

# Count recipes in cookbook_structure
with open('cookbook_structure.yaml', 'r') as f:
    structure = yaml.safe_load(f)

recipes_in_structure = []
for section in structure['sections']:
    recipes_in_structure.extend(section['recipes'])

recipes_in_structure = list(set(recipes_in_structure))
total_in_structure = len(recipes_in_structure)

print(f'Total recipes in cookbook_structure: {total_in_structure}')

# Get all yaml files that exist
yaml_files = glob.glob('recipes/*.yaml')
yaml_file_ids = set()
for filepath in yaml_files:
    filename = os.path.basename(filepath)
    recipe_id = filename.replace('.yaml', '')
    yaml_file_ids.add(recipe_id)

# Find missing recipes (in structure but no yaml file)
missing_recipes = [r for r in recipes_in_structure if r not in yaml_file_ids]
print(f'Missing recipes (in structure but no yaml file): {len(missing_recipes)}')
if missing_recipes:
    print(f'  -> {", ".join(sorted(missing_recipes))}')

# Check template status for recipes that have yaml files
template_recipes = []
filled_recipes = []

for recipe_id in recipes_in_structure:
    if recipe_id in yaml_file_ids:
        filepath = f'recipes/{recipe_id}.yaml'
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Check if it's just a template (empty fields)
        if 'prep_time: ""' in content and 'cook_time: ""' in content and 'servings: ""' in content:
            template_recipes.append(recipe_id)
        else:
            filled_recipes.append(recipe_id)

print(f'Recipes with content: {len(filled_recipes)}')
print(f'Empty template recipes (in structure): {len(template_recipes)}')
if template_recipes:
    print(f'  -> {", ".join(sorted(template_recipes))}')

# Find orphaned yaml files (exist but not in structure)
orphaned_recipes = [r for r in yaml_file_ids if r not in recipes_in_structure]
print(f'\nOrphaned yaml files (not in structure): {len(orphaned_recipes)}')
if orphaned_recipes:
    print(f'  -> {", ".join(sorted(orphaned_recipes))}')

print(f'\n--- Summary ---')
print(f'Total in cookbook_structure: {total_in_structure}')
print(f'With yaml files: {len(filled_recipes) + len(template_recipes)}')
print(f'  - Filled with content: {len(filled_recipes)}')
print(f'  - Empty templates: {len(template_recipes)}')
print(f'Missing yaml files: {len(missing_recipes)}')
print(f'Orphaned yaml files: {len(orphaned_recipes)}')
