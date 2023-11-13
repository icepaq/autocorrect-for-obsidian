This is currently under development and not yet ready for use. I would be glad to have contributors on this project. If you choose to, please first reach out on [Twitter] (https://twitter.com/0xAnton1) or open a GitHub issue :)

# Autocorrect and Auto Suggestions

This project is an experiemntation and exploration into how embeddings and vector databases work. The goal is to create a plugin in Obsidian that would automatically correct misspelled words.

## Setup

1. Run `python -m pip install chromadb chars2vec tensorflow flask flask-cors`. Requirements file coming soon :)
2. Run `python train.py` to fill the database.
3. Run `python compare.py` to start the server.
4. Open `obsidian_plugin/esbuild.config.mjs` and change line 41 to your [Obsidian plugin directory](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
5. Run `npm run dev` in the root directory to build the plugin.
6. Make sure you follow the instructions in the [Obsidian docs](https://docs.obsidian.md/Plugins/Getting+started) to enable the plugin.

Each time a change is made to the plugin, you need to reload Obsidian by pressing `Ctrl + P` for the pallete and typing `Reload app without saving`

## How it works

Embeddings are stored in a chromadb database. These embeddings are generated by char2vec models.

When a word is typed it is referenced against a dictionary of words. If no word is found, then the mispelled word is sent over to the server and returns the closest word in the database.

## Challenges

The char2vec model seems to be a little weak and can't really be trusted. For example, mispelled versions of "astronomer" work really well. However "together" not so much. I think some sort of distance limit on how far the closest vector is allowed to be if a suggestion is added. Also context dependant words will help a lot. But first I need to find a database with a few million sentences!

## Future Plans

- [ ] Auto suggestions
- [ ] Notion plugin
