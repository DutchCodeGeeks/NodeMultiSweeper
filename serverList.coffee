storage = require "node-persist"
_ = require "lodash"
storage.initSync()

$ ->
	servers = JSON.parse (storage.getItem("servers") ? "[]")
	for server in servers then do (server) -> $("div#serverList").append "<div>#{server}</div>"

	$("div#serverList").on "click", "div", (event) ->
		[ip, port] = $(event.target).text().split ":"

		global.IP = ip
		global.Port = port ? 1337

		document.location.href = "content/app.html"

	$("div#serverList").on "contextmenu", "div", (event) ->
		_.remove servers, (s) -> s is $(event.target).text()

		$("div#serverList").html ""
		for server in servers then do (server) -> $("div#serverList").append "<div>#{server}</div>"
		storage.setItem "servers", JSON.stringify servers

	$("input[type=text]").keydown (event) ->
		return unless event.which is 13

		servers.push event.target.value
		$("div#serverList").append "<div>#{event.target.value}</div>"
		storage.setItem "servers", JSON.stringify servers