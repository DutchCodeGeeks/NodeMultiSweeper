net = require 'net'
_ = require "lodash"
gui = require "nw.gui"

if global.IP? and global.Port?
	ip = global.IP
	port = +global.Port
else
	[ip, port] = prompt("IP of the server( + port) (eg. localhost:1337):").split ":"
	port = +port

socket = new net.Socket()

board = null
playerCount = null
bombCount = 0
onTurn = no
players = []
currentRound = 0
currentPlayerId = -> (currentRound - 1) % playerCount

class Board
	board: null
	flags: null

	constructor: (@width, @height) ->
		@board = @flags = null
		$("div#playerList").html ""
		$("table").html "<tbody></tbody>"

		for y in [0...height]
			r = document.createElement "tr"
			for x in [0...width]
				c = $ document.createElement "td"

				c.attr "id", "#{x}_#{y}"
				c.attr "x", x
				c.attr "y", y

				r.appendChild c.get()[0]
			document.getElementsByTagName("tbody")[0].appendChild r

		@board = ( ( undefined for [0..width] ) for [0..height] )
		@flags = ( ( undefined for [0..width] ) for [0..height] )
		$("div#bombCount").text bombCount + if bombCount is 1 then " bommetje D:" else " bommetjes D:"
		for p, i in players
			$("div#playerList").append "<div id=\"#{i}\">#{p}</div>"

	flag: (x, y) ->
		if !@board[y][x]? and (bombCount isnt 0 or @flags[y][x])
			val = @flags[y][x] = not @flags[y][x]
			$("td##{x}_#{y}").text if val then "F" else ""
			$("div#bombCount").text (if val then --bombCount else ++bombCount) + if bombCount is 1 then " bommetje D:" else " bommetjes D:"

	click: (x, y) ->
		if onTurn and !@board[y][x]? and !@flags[y][x]
			socket.write "click #{x} #{y}\n"
			onTurn = no

	update: (s) ->
		$("td").removeClass "lastChanged"
		data = (+x for x in s)

		for value, i in data
			x = i % @width
			y = ~~(i / @width)
			value = if value is 9 then undefined else value
			
			$("td##{x}_#{y}").addClass("lastChanged") unless @board[y][x] is value or currentRound is 1 or value is 10

			@board[y][x] = value
			if value?
				if @flags[y][x]
					@flags[y][x] = no
					$("div#bombCount").text ++bombCount + if bombCount is 1 then " bommetje D:" else " bommetjes D:"
				$("td##{x}_#{y}").text if value? and value isnt 0 then (if value is 10 then "B" else value) else ""
				$("td##{x}_#{y}").addClass "known " + if value is 10 then "bomb" else ""

socket.connect port, ip

writeName = ->
	name = prompt "What's your name?"
	if name? and name.trim() isnt "" then socket.write "name #{name}\n"
	else writeName()

commands =
	"multisweeper v1": ->
		socket.write "multisweeper client v1\n"
		writeName()

	"num_players": (params) ->
		players = []
		playerCount = (Number) params[0]

	"player": (params) ->
		players.push params.join " "

	"turn_start": ->
		$("table").animate { opacity: 1 }
		$("td").css({ cursor: "pointer" })
		process.stdout.write "\x07"
		onTurn = yes

	"start": (params) ->
		return unless params.length is 3

		[width, height, bombCount] = params

		bombCount = (Number) bombCount

		board = new Board +width, +height

	"board_update": (params) ->
		board.update params

	"turn_id_update": (params) ->
		$("table").animate { opacity: .7 }
		$("td").css({ cursor: "default" })

		currentRound = (Number) params[0]
		$("#playerList > div").removeClass "onMove"
		$("#playerList > div##{currentPlayerId()}").addClass "onMove"

	"end_condition": (params) ->
		result = (Number) params[0]

		if _.contains [0, 2], result
			alert if result is 0 then "You Lost!" else if result is 2 then "You Win!"
			canQuit()

	"sudden_exit": -> gui.App.quit()

_closed = no
_canQuit = no
canQuit = -> _canQuit = yes; if _closed then gui.App.quit()

$ ->
	$("body").on "click", "td", (event) ->
		target = $ event.target
		[x, y] = (+target.attr i for i in ["x", "y"])

		board.click x, y

	$("body").on "contextmenu", "td", (event) ->
		target = $ event.target
		[x, y] = (+target.attr i for i in ["x", "y"])

		board.flag x, y

	socket.on "data", (b) ->
		result = b.toString()
		for data in result.split("\n")
			if (val = _.find _.keys(commands), (c) -> data.indexOf(c) isnt -1)?
				params = data.split(" ")[1..]
				commands[val](params)

	gui.Window.get().on "close", -> socket.end(); socket.destroy(); @close yes
	socket.on "close", -> 
		_closed = yes
		if _canQuit then gui.App.quit()