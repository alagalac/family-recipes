# Family Recipies

Our family recipe book


## Setup

Install the following:

`pip install pyyaml markdown2 fpdf python-docx`

Configure the versioned pre-commit hook once per checkout:

`git config core.hooksPath .githooks`

The SPA checks for updated assets when it opens online and uses cached assets when offline. You do not need to change a cache version for normal CSS, JavaScript, or recipe changes. Change `CACHE_NAME` only when deliberately changing the service-worker cache structure.

Run:

`python generate_web_cookbook.py`

Check the recipe catalogue manually with:

`python check_recipes.py`
