# Family Recipies

Our family recipe book


## Setup

Install the following:

`pip install pyyaml markdown2 fpdf python-docx`

Configure the versioned pre-commit hook once per checkout:

`git config core.hooksPath .githooks`

When changing files under `docs/spa`, increment `CACHE_NAME` in `docs/spa/sw.js` in the same commit so installed copies receive the update. The pre-commit hook checks this automatically.

Run:

`python generate_web_cookbook.py`

Check the recipe catalogue manually with:

`python check_recipes.py`
