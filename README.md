# TopoKanji

> **15 seconds explanation**: for people learning Japanese as a second language, learning kanji in "visual decomposition" order (e.g. `一 → 二 → 三`, `言 → 五 → 口 → 語`, etc.) is better than in the order taught by [JLPT][] levels or in Japanese schools. This project provides such lists of kanji.

The goal of TopoKanji project is to provide people who want to learn Japanese [kanji][] with a properly ordered list of kanji which makes the learning process as fast, simple, and effective as possible.

Motivation for this project initially came from reading this article: [The 5 Biggest Mistakes People Make When Learning Kanji][mistakes].

Sample (first 100 kanji from [lists/aozora.txt](lists/aozora.txt)):

    人一二丨冂囗口目丿儿
    見凵山出日十八木未来
    大亅了子丶心土田思彳
    行寸寺時上刀分厶禾私
    中匚事丁可亻何自乂又
    皮彼亠方三生彐門間扌
    手言女本乙气気年者月
    刂前勹冫豕冖宀家今卜
    下白勺的云牛物立小文
    矢知入乍作聿書学合幺

Final lists can be found in [`lists` directory](lists). Lists are only differ in order of kanji. Each file contains kanji, grouped by 10 per line, starting from simplest.

You can use them to build an [Anki][] deck or just as a guidance. There are few options:

- `aozora.txt` - if you're learning Japanese language primarily to be able to read Japanese novels
- `twitter.txt` - if you want to chat with your friends from Japan
- `wikipedia.txt` - if your goal is to be able to read documents in Japanese
- `all.txt` - combined "average" version of all previous. This one is experimental, I don't recommend using it

## What is a properly ordered list of kanji?

If you look at a kanji like 語, you can see it consists of at least three distinct parts: 言, 五, 口. Those are kanji by themselves too. The idea behind this project is to find the order of about 2000-2500 common kanji, in which no kanji appears before its' parts, so you only learn a new kanji when you already know its' components.

### Properties of properly ordered lists

1. **No kanji appear before it's parts (components).** In fact, in you treat kanji as nodes in a [graph][] structure, and connect them with directed edges, where each edge means "kanji A includes kanji B as a component", it all forms a [directed acyclic graph (DAG)][dag]. For any DAG, it is possible to build a [topological order][topsort], which is basically what "no kanji appear before it's parts" means.
2. **More common kanji come first.** That way you learn useful characters as soon as possible.

### Algorithm

[Topological sorting][topsort] is done by using a modified version of [Kahn (1962) algorithm][kahn] with intermediate sorting step which deals with the second property above. This intermediate sorting uses the "weight" of each character: common kanji (lighter) tend appear before rare kanji (heavier). See source code for details.

## Used data

- Initial unsorted list contains only kanji which are present in [KanjiVG][] project, so for each character there is a data of its' shape and stroke order
- Characters are split into components using [CJK Decompositions Data][cjk] project, along with "fixes" to simplify final lists and avoid characters which are not present in initial list
- Statistical data of kanji usage frequencies was gathered by processing data from various sources:
  - [Wikimedia Downloads][wiki-dumps] - snapshot of all pages and articles of Japanese Wikipedia
  - [Aozora Bunko][aozora] - large collection of Japanese literature
  - [Twitter's Streaming API][twitter-stream] - public stream of tweets, filtered by language and location

## Which kanji are in the list

Initial list contain only common kanji, because it is build for people who just started learning kanji.

Kanji is considered "common" if:

- it is among the 2000-3000 most frequently used (according to some statistical data)
- at least one of the following conditions are met:
  - it is among the [Jouyou kanji][jouyou]
  - it is a [Kangxi radical][kangxi], but not a complex or rarely used one
  - it is used in common words (a tricky condition, don't rely just on this)

## Files and formats

Files in `lists` directory are final lists. They contain kanji grouped by 10 per line.

Files in `data` directory:

- `kanji.txt` - list of kanji characters included in final ordered lists
- `radicals.txt` - list of [radicals][kangxi] included in `kanji.txt`, but only those which are not common kanji by themselves. This file is intended to use as a list of exceptions when checking which characters are common
- `kanjivg.txt` - list of kanji from [KanjiVG][]
- `cjk-decomp-{VERSION}.txt` - data from [CJK Decompositions Data][cjk], without any modifications
- `cjk-decomp-override.txt` - data to override some CJK's decompositions
- `kanji-frequency/*.json` - kanji frequency tables

All files are encoded in UTF-8, without [byte order mark (BOM)][bom]. All files, except for `cjk-decomp-{VERSION}.txt`, have unix-style [line endings][eol], `LF`.

### kanji.txt

Contains initial list of kanji, including radicals.

- Each character must be listed in `kanjivg.txt`
- Each character must be listed in one of `cjk-decomp-*.txt` files
- Each character must appear on a line which number is equal to a number of strokes in the character
- No extra whitespace or any other symbols, comments, etc.

### radicals.txt

List of [radicals][kangxi]. Must only contain characters which are also in `kanji.txt`, but must not contain radicals which are also common kanji by themselves. Organized the same way as `kanji.txt`.

### kanjivg.txt

Simple list of characters which are present in KanjiVG project. Those are from the list of *.svg files in [KanjiVG's Github repository][kanjivg-github].

### cjk-decomp-{VERSION}.txt

Data file from [CJK Decompositions Data][cjk] project, see [description of its' format][cjk-format].

### cjk-decomp-override.txt

Same format as `cjk-decomp-{VERSION}.txt`, except the only purpose of each pictorial configuration record here is to override the one from `cjk-decomp-{VERSION}.txt`. The type of decomposition is always `fix`, which just means "fix a record for the same character from original file".

Special character `0` is used to distinguish invalid decompositions (which lead to characters with no graphical representation) from those which just can't be decomposed further into something meaningful. For example, `一:fix(0)` means that this kanji can't be further decomposed, since it's just a single stroke.

### kanji-frequency/*.json

Kanji usage frequency data in [JSON][] format. Each file contain an array of arrays (rows). Each row contains three fields:

1. (string) Kanji itself. `"all"` is a special case in the first row.
2. (integer) How many times it was found in the analyzed data set. For `"all"` it is a total number of kanji, including repetitions.
3. (float) Fraction of total amount of data this character represents. For `"all"` it is `1` (e.i. 100%).

Currently present data:

- `aozora.json` - data from [Aozora Bunko][aozora], about 12900 files containing various works of Japanese literature (May 2015)
- `twitter.json` - data from [Twitter's Streaming API][twitter-stream], collected in about one week (June 2015) using a [bot][twitter-bot]
- `wikipedia.json` - data from [Wikimedia Downloads][wiki-dumps], full snapshot of Japanese Wikipedia (May 2015)

## Usage

You must have Node.js and Git installed

1. `git clone https://github.com/THIS/REPO.git`
2. `npm install`
3. `node build.js`

### Command-line arguments

- only one of following:
  - `--override-final-lists` - write to files in `lists` directory
  - `--suggest=NUM` - suggest addition/deletion of `NUM` most/least frequently used characters into/from list (`data/kanji.txt`) according to kanji usage frequency tables
  - no argument or (optional) `--chars-per-line=NUM` (default 50) - only display sorted list without writing into file. Display `NUM` characters per one line of output
- (optional) `--use-freq-table=TABLE_NAME` - preform operations mentioned above only for one frequency table name. Table names are file names from `data/kanji-frequency` directory, without `.json` extension, e.g. `aozora`, `twitter`, etc. When omitted, all frequency tables are used

## Contributing

Consider *not* adding or removing kanji from the initial list. It is made for beginners, so don't include uncommon kanji or kanji used primarily in names. Remove kanji from the initial list *only* if you sure it's not common by any criteria.

All other contributions, suggestions, fixes, and requests are welcome!

## License

This is a multi-license project. Choose any license from this list:

- [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/)
- [MIT](http://opensource.org/licenses/MIT)
- [Apache 2.0](http://www.apache.org/licenses/LICENSE-2.0)
- [LGPL 3.0](http://www.gnu.org/licenses/lgpl-3.0.html)
- [ODC-By 1.0](http://opendatacommons.org/licenses/by/1.0/)
- [Eclipse 1.0](https://www.eclipse.org/legal/epl-v10.html)

[mistakes]: http://www.tofugu.com/2010/03/25/the-5-biggest-mistakes-people-make-when-learning-kanji/
[jlpt]: http://www.jlpt.jp/e/
[anki]: http://ankisrs.net/
[kanji]: https://en.wikipedia.org/wiki/Kanji
[graph]: https://en.wikipedia.org/wiki/Graph_(mathematics)
[dag]: https://en.wikipedia.org/wiki/Directed_acyclic_graph
[topsort]: https://en.wikipedia.org/wiki/Topological_sorting
[logogram]: https://en.wikipedia.org/wiki/Logogram
[kahn]: http://dl.acm.org/citation.cfm?doid=368996.369025
[wiki-dumps]: https://dumps.wikimedia.org/
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
