// Generated by CoffeeScript 1.7.1
(function() {
  var storage, _;

  storage = require("node-persist");

  _ = require("lodash");

  storage.initSync();

  $(function() {
    var server, servers, _fn, _i, _len, _ref;
    servers = JSON.parse((_ref = storage.getItem("servers")) != null ? _ref : "[]");
    _fn = function(server) {
      return $("div#serverList").append("<div>" + server + "</div>");
    };
    for (_i = 0, _len = servers.length; _i < _len; _i++) {
      server = servers[_i];
      _fn(server);
    }
    $("div#serverList").on("click", "div", function(event) {
      var ip, port, _ref1;
      _ref1 = $(event.target).text().split(":"), ip = _ref1[0], port = _ref1[1];
      global.IP = ip;
      global.Port = port != null ? port : 1337;
      return document.location.href = "content/app.html";
    });
    $("div#serverList").on("contextmenu", "div", function(event) {
      var _fn1, _j, _len1;
      _.remove(servers, function(s) {
        return s === $(event.target).text();
      });
      $("div#serverList").html("");
      _fn1 = function(server) {
        return $("div#serverList").append("<div>" + server + "</div>");
      };
      for (_j = 0, _len1 = servers.length; _j < _len1; _j++) {
        server = servers[_j];
        _fn1(server);
      }
      return storage.setItem("servers", JSON.stringify(servers));
    });
    return $("input[type=text]").keydown(function(event) {
      if (event.which !== 13) {
        return;
      }
      servers.push(event.target.value);
      $("div#serverList").append("<div>" + event.target.value + "</div>");
      return storage.setItem("servers", JSON.stringify(servers));
    });
  });

}).call(this);
