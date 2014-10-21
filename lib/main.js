// Generated by CoffeeScript 1.7.1
(function() {
  var Board, board, bombCount, canQuit, commands, currentPlayerId, currentRound, gui, ip, net, onTurn, playerCount, players, port, socket, writeName, _, _canQuit, _closed, _ref;

  net = require('net');

  _ = require("lodash");

  gui = require("nw.gui");

  if ((global.IP != null) && (global.Port != null)) {
    ip = global.IP;
    port = +global.Port;
  } else {
    _ref = prompt("IP of the server( + port) (eg. localhost:1337):").split(":"), ip = _ref[0], port = _ref[1];
    port = +port;
  }

  socket = new net.Socket();

  board = null;

  playerCount = null;

  bombCount = 0;

  onTurn = false;

  players = [];

  currentRound = 0;

  currentPlayerId = function() {
    return (currentRound - 1) % playerCount;
  };

  Board = (function() {
    Board.prototype.board = null;

    Board.prototype.flags = null;

    function Board(width, height) {
      var c, i, p, r, x, y, _i, _j, _k, _len;
      this.width = width;
      this.height = height;
      this.board = this.flags = null;
      $("div#playerList").html("");
      $("table").html("<tbody></tbody>");
      for (y = _i = 0; 0 <= height ? _i < height : _i > height; y = 0 <= height ? ++_i : --_i) {
        r = document.createElement("tr");
        for (x = _j = 0; 0 <= width ? _j < width : _j > width; x = 0 <= width ? ++_j : --_j) {
          c = $(document.createElement("td"));
          c.attr("id", "" + x + "_" + y);
          c.attr("x", x);
          c.attr("y", y);
          r.appendChild(c.get()[0]);
        }
        document.getElementsByTagName("tbody")[0].appendChild(r);
      }
      this.board = (function() {
        var _k, _results;
        _results = [];
        for (_k = 0; 0 <= height ? _k <= height : _k >= height; 0 <= height ? _k++ : _k--) {
          _results.push((function() {
            var _l, _results1;
            _results1 = [];
            for (_l = 0; 0 <= width ? _l <= width : _l >= width; 0 <= width ? _l++ : _l--) {
              _results1.push(void 0);
            }
            return _results1;
          })());
        }
        return _results;
      })();
      this.flags = (function() {
        var _k, _results;
        _results = [];
        for (_k = 0; 0 <= height ? _k <= height : _k >= height; 0 <= height ? _k++ : _k--) {
          _results.push((function() {
            var _l, _results1;
            _results1 = [];
            for (_l = 0; 0 <= width ? _l <= width : _l >= width; 0 <= width ? _l++ : _l--) {
              _results1.push(void 0);
            }
            return _results1;
          })());
        }
        return _results;
      })();
      $("div#bombCount").text(bombCount + (bombCount === 1 ? " bommetje D:" : " bommetjes D:"));
      for (i = _k = 0, _len = players.length; _k < _len; i = ++_k) {
        p = players[i];
        $("div#playerList").append("<div id=\"" + i + "\">" + p + "</div>");
      }
    }

    Board.prototype.flag = function(x, y) {
      var val;
      if ((this.board[y][x] == null) && (bombCount !== 0 || this.flags[y][x])) {
        val = this.flags[y][x] = !this.flags[y][x];
        $("td#" + x + "_" + y).text(val ? "F" : "");
        return $("div#bombCount").text((val ? --bombCount : ++bombCount) + (bombCount === 1 ? " bommetje D:" : " bommetjes D:"));
      }
    };

    Board.prototype.click = function(x, y) {
      if (onTurn && (this.board[y][x] == null) && !this.flags[y][x]) {
        socket.write("click " + x + " " + y + "\n");
        return onTurn = false;
      }
    };

    Board.prototype.update = function(s) {
      var data, i, value, x, y, _i, _len, _results;
      $("td").removeClass("lastChanged");
      data = (function() {
        var _i, _len, _results;
        _results = [];
        for (_i = 0, _len = s.length; _i < _len; _i++) {
          x = s[_i];
          _results.push(+x);
        }
        return _results;
      })();
      _results = [];
      for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
        value = data[i];
        x = i % this.width;
        y = ~~(i / this.width);
        value = value === 9 ? void 0 : value;
        if (!(this.board[y][x] === value || currentRound === 1 || value === 10)) {
          $("td#" + x + "_" + y).addClass("lastChanged");
        }
        this.board[y][x] = value;
        if (value != null) {
          if (this.flags[y][x]) {
            this.flags[y][x] = false;
            $("div#bombCount").text(++bombCount + (bombCount === 1 ? " bommetje D:" : " bommetjes D:"));
          }
          $("td#" + x + "_" + y).text((value != null) && value !== 0 ? (value === 10 ? "B" : value) : "");
          _results.push($("td#" + x + "_" + y).addClass("known " + (value === 10 ? "bomb" : "")));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    return Board;

  })();

  socket.connect(port, ip);

  writeName = function() {
    var name;
    name = prompt("What's your name?");
    if ((name != null) && name.trim() !== "") {
      return socket.write("name " + name + "\n");
    } else {
      return writeName();
    }
  };

  commands = {
    "multisweeper v1": function() {
      socket.write("multisweeper client v1\n");
      return writeName();
    },
    "num_players": function(params) {
      players = [];
      return playerCount = Number(params[0]);
    },
    "player": function(params) {
      return players.push(params.join(" "));
    },
    "turn_start": function() {
      $("table").animate({
        opacity: 1
      });
      $("td").css({
        cursor: "pointer"
      });
      process.stdout.write("\x07");
      return onTurn = true;
    },
    "start": function(params) {
      var height, width;
      if (params.length !== 3) {
        return;
      }
      width = params[0], height = params[1], bombCount = params[2];
      bombCount = Number(bombCount);
      return board = new Board(+width, +height);
    },
    "board_update": function(params) {
      return board.update(params);
    },
    "turn_id_update": function(params) {
      $("table").animate({
        opacity: .7
      });
      $("td").css({
        cursor: "default"
      });
      currentRound = Number(params[0]);
      $("#playerList > div").removeClass("onMove");
      return $("#playerList > div#" + (currentPlayerId())).addClass("onMove");
    },
    "end_condition": function(params) {
      var result;
      result = Number(params[0]);
      if (_.contains([0, 2], result)) {
        alert(result === 0 ? "You Lost!" : result === 2 ? "You Win!" : void 0);
        return canQuit();
      }
    },
    "sudden_exit": function() {
      return gui.App.quit();
    }
  };

  _closed = false;

  _canQuit = false;

  canQuit = function() {
    _canQuit = true;
    if (_closed) {
      return gui.App.quit();
    }
  };

  $(function() {
    $("body").on("click", "td", function(event) {
      var i, target, x, y, _ref1;
      target = $(event.target);
      _ref1 = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = ["x", "y"];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          _results.push(+target.attr(i));
        }
        return _results;
      })(), x = _ref1[0], y = _ref1[1];
      return board.click(x, y);
    });
    $("body").on("contextmenu", "td", function(event) {
      var i, target, x, y, _ref1;
      target = $(event.target);
      _ref1 = (function() {
        var _i, _len, _ref1, _results;
        _ref1 = ["x", "y"];
        _results = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          i = _ref1[_i];
          _results.push(+target.attr(i));
        }
        return _results;
      })(), x = _ref1[0], y = _ref1[1];
      return board.flag(x, y);
    });
    socket.on("data", function(b) {
      var data, params, result, val, _i, _len, _ref1, _results;
      result = b.toString();
      _ref1 = result.split("\n");
      _results = [];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        data = _ref1[_i];
        if ((val = _.find(_.keys(commands), function(c) {
          return data.indexOf(c) !== -1;
        })) != null) {
          params = data.split(" ").slice(1);
          _results.push(commands[val](params));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    });
    gui.Window.get().on("close", function() {
      socket.end();
      socket.destroy();
      return this.close(true);
    });
    return socket.on("close", function() {
      _closed = true;
      if (_canQuit) {
        return gui.App.quit();
      }
    });
  });

}).call(this);