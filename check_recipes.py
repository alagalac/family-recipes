import argparse
import glob
import re
from collections import Counter
from pathlib import Path

import yaml


REQUIRED_FIELDS = {
    'title', 'prep_time', 'cook_time', 'servings', 'ingredients',
    'instructions', 'notes', 'commentary', 'attribution'
}
TIME_FIELDS = ('prep_time', 'cook_time')
SHORT_TIME_UNIT = re.compile(r'(?i)(?<![a-z])(?:h|hr|hrs|m|min|mins)(?![a-z])')


def main():
    parser = argparse.ArgumentParser(description='Validate the recipe catalogue.')
    parser.add_argument(
        '--strict-placeholders',
        action='store_true',
        help='treat recipes with empty content as errors',
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parent
    structure_path = root / 'cookbook_structure.yaml'
    recipes_path = root / 'recipes'
    errors = []
    warnings = []

    try:
        with structure_path.open(encoding='utf-8') as file:
            structure = yaml.safe_load(file)
    except (OSError, yaml.YAMLError) as error:
        print(f'ERROR: unable to load {structure_path.name}: {error}')
        return 1

    sections = structure.get('sections') if isinstance(structure, dict) else None
    if not isinstance(sections, list):
        print('ERROR: cookbook_structure.yaml must contain a sections list')
        return 1

    catalog_entries = []
    for section in sections:
        if not isinstance(section, dict) or not isinstance(section.get('recipes'), list):
            errors.append('each section must contain a recipes list')
            continue
        catalog_entries.extend(section['recipes'])

    duplicate_entries = sorted(
        recipe_id for recipe_id, count in Counter(catalog_entries).items() if count > 1
    )
    if duplicate_entries:
        errors.append(f'duplicate catalogue entries: {", ".join(duplicate_entries)}')

    recipe_files = glob.glob(str(recipes_path / '*.yaml'))
    recipe_ids = {Path(filepath).stem for filepath in recipe_files}
    catalog_ids = set(catalog_entries)

    missing_recipes = sorted(catalog_ids - recipe_ids)
    if missing_recipes:
        errors.append(f'missing recipe files: {", ".join(missing_recipes)}')

    orphaned_recipes = sorted(recipe_ids - catalog_ids)
    if orphaned_recipes:
        errors.append(f'orphaned recipe files: {", ".join(orphaned_recipes)}')

    placeholders = []
    for filepath in recipe_files:
        recipe_path = Path(filepath)
        try:
            with recipe_path.open(encoding='utf-8') as file:
                recipe = yaml.safe_load(file)
        except (OSError, yaml.YAMLError) as error:
            errors.append(f'{recipe_path.name}: invalid YAML: {error}')
            continue

        if not isinstance(recipe, dict):
            errors.append(f'{recipe_path.name}: recipe must be a YAML mapping')
            continue

        missing_fields = sorted(REQUIRED_FIELDS - set(recipe))
        extra_fields = sorted(set(recipe) - REQUIRED_FIELDS)
        if missing_fields:
            errors.append(f'{recipe_path.name}: missing fields: {", ".join(missing_fields)}')
        if extra_fields:
            errors.append(f'{recipe_path.name}: unexpected fields: {", ".join(extra_fields)}')

        for field in TIME_FIELDS:
            value = recipe.get(field)
            if value and not isinstance(value, str):
                errors.append(f'{recipe_path.name}: {field} must be text')
            elif isinstance(value, str) and SHORT_TIME_UNIT.search(value):
                errors.append(
                    f'{recipe_path.name}: {field} must use "hour(s)" and "minute(s)", '
                    f'not shorthand: {value}'
                )

        if not recipe.get('title'):
            placeholders.append(recipe_path.stem)

    if placeholders:
        message = f'placeholder recipes: {", ".join(sorted(placeholders))}'
        if args.strict_placeholders:
            errors.append(message)
        else:
            warnings.append(message)

    print(f'Total catalogue entries: {len(catalog_entries)}')
    print(f'Unique recipes in catalogue: {len(catalog_ids)}')
    print(f'Recipe files: {len(recipe_ids)}')
    for warning in warnings:
        print(f'WARNING: {warning}')
    for error in errors:
        print(f'ERROR: {error}')

    if errors:
        print(f'Validation failed with {len(errors)} error(s).')
        return 1

    print('Validation passed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
