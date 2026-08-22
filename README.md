# Family Recipies

Our family recipe book


## Setup

Install the following:

`pip install pyyaml markdown2 fpdf python-docx`

Configure the versioned pre-commit hook once per checkout:

`git config core.hooksPath .githooks`

Run:

`python generate_web_cookbook.py`

Check the recipe catalogue manually with:

`python check_recipes.py`
