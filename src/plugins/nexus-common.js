export default {
  // eslint-disable-next-line

  install: (app) => {
    const MAP_HEX = {
      0: 0,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
      5: 5,
      6: 6,
      7: 7,
      8: 8,
      9: 9,
      a: 10,
      b: 11,
      c: 12,
      d: 13,
      e: 14,
      f: 15,
      A: 10,
      B: 11,
      C: 12,
      D: 13,
      E: 14,
      F: 15,
    };

    app.mixin({
      methods: {
        wordwrap: (str, width, cut) => {
          width = width || 75;
          cut = cut || false;

          if (!str) {
            return str;
          }

          let regex =
            ".{1," +
            width +
            "}(\\s|$)" +
            (cut ? "|.{" + width + "}|.+$" : "|\\S+?(\\s|$)");

          return str.match(RegExp(regex, "g")).map((s) => s.trim());
        },
        hardwrap: (str, width) => {
          width = width || 64;

          if (!str) {
            return str;
          }

          let regex = `.{1,${width}}`;

          return str.match(RegExp(regex, "g")).map((s) => s.trim());
        },
        breakURI: (str, width) => {
          width = width || 64;
          const uri_split_regex = `(.+://)|.{1,${width}}(/|$)|[^/]+?(/|$)`;

          return str.match(RegExp(uri_split_regex, "g"));
        },
        bufferFromHex: (hexString) => {
          const bytes = new Uint8Array(
            Math.floor((hexString || "").length / 2)
          );
          let i;
          for (i = 0; i < bytes.length; i++) {
            const a = MAP_HEX[hexString[i * 2]];
            const b = MAP_HEX[hexString[i * 2 + 1]];
            if (a === undefined || b === undefined) {
              break;
            }
            bytes[i] = (a << 4) | b;
          }
          return i === bytes.length ? bytes : bytes.slice(0, i);
        },
        hexOnly: (str) => {
          if (!str) {
            return str;
          }
          return str.replace(/[^a-f0-9]/gi, "").trim();
        },
      },
    });
  },
};
