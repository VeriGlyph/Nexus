import Vue from "vue";

Vue.mixin({
  methods: {
    wordwrap(str, width, brk, cut) {
      brk = brk || "\n";
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

      return str.match(RegExp(regex, "g")).join(brk);
    },
    breakUri(str, width) {
      width = width || 64;
      const uri_split_regex = `(.+://)|.{1,${width}}(/|$)|[^/]+?(/|$)`;

      return str.match(RegExp(uri_split_regex, "g"));
    },
  },
});
