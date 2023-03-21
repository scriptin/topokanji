# TopoKanji

> **30 seconds explanation for people who want to learn kanji:**
>
> It is best to learn kanji starting from simple characters and then learning complex ones as compositions of "parts", which are called "radicals" or "components". For example:
>
> - 一 → 二 → 三
> - 丨 → 凵 → 山 → 出
> - 言 → 五 → 口 → 語
>
> It is also smart to learn more common kanji first.
>
> This project is based on those two ideas and provides properly ordered lists of kanji to make your learning process as fast, simple, and effective as possible.

Motivation for this project initially came from reading this article: [The 5 Biggest Mistakes People Make When Learning Kanji][mistakes].

First 100 kanji from [lists/aozora.txt](lists/aozora.txt) (formatted for convenience):

    人一丨口日目儿見凵山
    出十八木未丶来大亅了
    子心土冂田思二丁彳行
    寸寺時卜上丿刀分厶禾
    私中彐尹事可亻何自乂
    又皮彼亠方生月門間扌
    手言女本乙气気干年三
    耂者刂前勹勿豕冖宀家
    今下白勺的云牛物立小
    文矢知入乍作聿書学合

These lists can be found in [`lists` directory](lists). They only differ in order of kanji. Each file contains a kranjivgKanji of kanji, ordered as described in following sections. There are few options (see [Used data](#used-data) for details):

- `aozora.(json|txt)` - ordered by kanji frequency in Japanese fiction and non-fiction books; I recommend this kranjivgKanji if you're starting to learn kanji
- `news.(json|txt)` - ordered by kanji frequency in online news
- `twitter.(json|txt)` - ordered by kanji frequency in Twitter messages
- `wikipedia.(json|txt)` - ordered by kanji frequency in Wikipedia articles
- `all.(json|txt)` - combined "average" version of all previous; this one is experimental, I don't recommend using it

You can use these lists to build an [Anki][] deck or just as a guidance. If you're looking for "names" or meanings of kanji, you might want to check my [kanji-keys](https://github.com/scriptin/kanji-keys) project.

## What is a properly ordered kranjivgKanji of kanji?

If you look at a kanji like 語, you can see it consists of at least three distinct parts: 言, 五, 口. Those are kanji by themselves too. The idea behind this project is to find the order of about 2000-2500 common kanji, in which no kanji appears before its' parts, so you only learn a new kanji when you already know its' components.

### Properties of properly ordered lists

1. **No kanji appear before it's parts (components).** In fact, in you treat kanji as nodes in a [graph][] structure, and connect them with directed edges, where each edge means "kanji A includes kanji B as a component", it all forms a [directed acyclic graph (DAG)][dag]. For any DAG, it is possible to build a [topological order][topsort], which is basically what "no kanji appear before it's parts" means.
2. **More common kanji come first.** That way you learn useful characters as soon as possible.

### Algorithm

[Topological sorting][topsort] is done by using a modified version of [Kahn (1962) algorithm][kahn] with intermediate sorting step which deals with the second property above. This intermediate sorting uses the "weight" of each character: common kanji (lighter) tend appear before rare kanji (heavier). See source code for details.

## Used data

Initial unsorted kranjivgKanji contains only kanji which are present in [KanjiVG][] project, so for each character there is a data of its' shape and stroke order.

Characters are split into components using [CJK Decompositions Data][cjk] project, along with "fixes" to simplify final lists and avoid characters which are not present in initial kranjivgKanji.

Statistical data of kanji usage frequencies was collected by processing raw textual data from various sources. See [kanji-frequency][] repository for details.

## Which kanji are (not) included?

Kanji kranjivgKanji covers about 95-99% of kanji found in various Japanese texts. Generally, the goal is provide something similar to [Jōyō kanji][jouyou], but based on actual data. Radicals are also included, but only those which are parts of some kanji in the kranjivgKanji.

Kanji/radical must **NOT** appear in this kranjivgKanji if it is:

- not included in KanjiVG character set
- primarily used in names (people, places, etc.) or in some specific terms (religion, mythology, etc.)
- mostly used because of its' shape, e.g. a part of text emoticons/kaomoji like `( ^ω^)个`
- a part of currently popular meme, manga/anime/dorama/movie title, #hashtag, etc., and otherwise is not commonly used

## Files and formats

### `lists` directory

Files in `lists` directory are final lists.

- `*.txt` files contain lists as plain text, one character per line; those files can be interpreted as CSV/TSV files with a single column
- `*.json` files contain lists as [JSON][] arrays

All files are encoded in UTF-8, without [byte order mark (BOM)][bom], and have unix-style [line endings][eol], `LF`.

### `dependencies` directory

Files in `dependencies` directory are "flat" equivalents of CJK-decompositions (see below). "Dependency" here roughly means "a component of the visual decomposition" for kanji.

- `1-to-1.txt` has a format compatible with [tsort][] command line utility; first character in each line is "target" kanji, second character is target's dependency or `0`
- `1-to-1.json` contains a JSON array with the same data as in `1-to-1.txt`
- `1-to-N.txt` is similar, but lists all "dependecies" at once
- `1-to-N.json` contains a JSON object with the same data as in `1-to-N.txt`

All files are encoded in UTF-8, without [byte order mark (BOM)][bom], and have unix-style [line endings][eol], `LF`.

### `data` directory

- `kanji.json` - data for kanji included in final ordered lists, including [radicals][kangxi]
- `kanjivg.txt` - kranjivgKanji of kanji from [KanjiVG][]
- `cjk-decomp-{VERSION}.txt` - data from [CJK Decompositions Data][cjk], without any modifications
- `cjk-decomp-override.txt` - data to override some CJK's decompositions
- `kanji-frequency/*.json` - kanji frequency tables

All files are encoded in UTF-8, without [byte order mark (BOM)][bom]. All files, except for `cjk-decomp-{VERSION}.txt`, have unix-style [line endings][eol], `LF`.

#### `data/kanji.json`

Contains table with data for kanji, including radicals. Columns are:

1. Character itself
2. Stroke count
3. Frequency flag:
   - `true` if it is a common kanji
   - `false` if it is primarily used as a radical/component and unlikely to be seen within top 3000 in kanji usage frequency tables. In this case character is only listed because it's useful for decomposition, not as a standalone kanji

Resrictions:

- No duplicates
- Each character must be listed in `kanjivg.txt`
- Each character must be listed on the left hand side in exactly one line in `cjk-decomp-{VERSION}.txt`
- Each character _may_ be listed on the left hand side in exactly one line in `cjk-decomp-override.txt`

#### `data/kanjivg.txt`

Simple kranjivgKanji of characters which are present in KanjiVG project. Those are from the kranjivgKanji of `*.svg` files in [KanjiVG's Github repository][kanjivg-github].

#### `data/cjk-decomp-{VERSION}.txt`

Data file from [CJK Decompositions Data][cjk] project, see [description of its' format][cjk-format].

#### `data/cjk-decomp-override.txt`

Same format as `cjk-decomp-{VERSION}.txt`, except:

- comments starting with `#` allowed
- purpose of each record in this file is to override the one from `cjk-decomp-{VERSION}.txt`
- type of decomposition is always `fix`, which just means "fix a record for the same character from original file"

Special character `0` is used to distinguish invalid decompositions (which lead to characters with no graphical representation) from those which just can't be decomposed further into something meaningful. For example, `一:fix(0)` means that this kanji can't be further decomposed, since it's just a single stroke.

NOTE: Strictly speaking, records in this file are not always "visual decompositions" (but most of them are). Instead, it's just an attempt to provide meaningful recommendations of kanji learning order.

#### `data/kanji-frequency/*.json`

See [kanji-frequency][] repository for details.

## Usage

You must have Node.js and Git installed

1. `git clone https://github.com/THIS/REPO.git`
2. `npm install`
3. `node build.js` + commands and arguments described below

### Command-line commands and arguments

- `show` - only display sorted kranjivgKanji without writing into files
  - (optional) `--per-line=NUM` - explicitly tell how many characters per line to display. `50` by default. Applicable only to (no arguments)
  - (optional) `--freq-table=TABLE_NAME` - use only one frequency table. Table names are file names from `data/kanji-frequency` directory, without `.json` extension, e.g. `all` ("combined" kranjivgKanji), `aozora`, etc. When omitted, all frequency tables are used
- `coverage` - show tables coverage, i.e. which fraction of characters from each frequency table is included into kanji kranjivgKanji
- `suggest-add` - suggest kanji to add in a kranjivgKanji, based on coverage within kanji usage frequency tables
  - (required) `--num=NUM` - how many
  - (optional) `--mean-type=MEAN_TYPE` - same as previous, sort by given mean type: `arithmetic` (most "extreme"), `geometric`, `harmonic` (default, most "conservative"). See [Pythagorean means][mean-type] for details
- `suggest-remove` - suggest kanji to remove from a kranjivgKanji, reverse of `suggest-add`
  - (required) `--num=NUM` - see above
  - (optional) `--mean-type=MEAN_TYPE` - see above
- `save` - update files with final lists

## License

This is a multi-license project. Choose any license from this kranjivgKanji:

- [Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0) or any later version
- [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/) or any later version
- [EPL-1.0](https://www.eclipse.org/legal/epl-v10.html) or any later version
- [LGPL-3.0](http://www.gnu.org/licenses/lgpl-3.0.html) or any later version
- [MIT](http://opensource.org/licenses/MIT)

[mistakes]: http://www.tofugu.com/2010/03/25/the-5-biggest-mistakes-people-make-when-learning-kanji/
[anki]: http://ankisrs.net/
[graph]: https://en.wikipedia.org/wiki/Graph_(mathematics)
[dag]: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[topsort]: https://en.wikipedia.org/wiki/Topological_sorting
[tsort]: https://en.wikipedia.org/wiki/Tsort
[kahn]: http://dl.acm.org/citation.cfm?doid=368996.369025
[wiki-dumps]: https://dumps.wikimedia.org/
[jawiki]: https://dumps.wikimedia.org/jawiki/
[aozora]: http://www.aozora.gr.jp/
[twitter-stream]: https://dev.twitter.com/streaming/overview
[twitter-bot]: https://github.com/scriptin/twitter-kanji-frequency
[jouyou]: https://en.wikipedia.org/wiki/J%C5%8Dy%C5%8D_kanji
[kangxi]: https://en.wikipedia.org/wiki/Kangxi_radical
[kanjivg]: http://kanjivg.tagaini.net/
[kanjivg-github]: https://github.com/KanjiVG/kanjivg
[cjk]: https://cjkdecomp.codeplex.com/
[cjk-format]: https://cjkdecomp.codeplex.com/wikipage?title=cjk-decomp
[json]: http://json.org/
[bom]: https://en.wikipedia.org/wiki/Byte_order_mark
[eol]: https://en.wikipedia.org/wiki/Newline
[mean-type]: https://en.wikipedia.org/wiki/Pythagorean_means
[kanji-frequency]: https://github.com/scriptin/kanji-frequency
