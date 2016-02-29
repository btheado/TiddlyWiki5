/*\
title: $:/plugins/tiddlywiki/internals/widgets/transclusion-tree.js
type: application/javascript
module-type: widget

Widget to render the widget tree of a tiddler

\*/
(function(){

/*jslint node: true, browser: true */
/*global $tw: false */
"use strict";

var Widget = require("$:/core/modules/widgets/widget.js").widget;

var TransclusionTreeWidget = function(parseTreeNode,options) {
	this.initialise(parseTreeNode,options);
};

/*
Inherit from the base widget class
*/
TransclusionTreeWidget.prototype = new Widget();

/*
Render this widget into the DOM
*/
TransclusionTreeWidget.prototype.render = function(parent,nextSibling) {
	var self = this;
	this.parentDomNode = parent;
	this.computeAttributes();
	this.execute();
	this.renderChildren(parent,nextSibling);
};

/*
Compute the internal state of the widget
*/
TransclusionTreeWidget.prototype.execute = function() {
	// Get our parameters
	this.widgetTreeTitle = this.getAttribute("tiddler",this.getVariable("currentTiddler"));
	this.widgetTreeInlineMode = this.getAttribute("mode","block") === "inline";
	// Compute the widget tree
	var parser = this.wiki.parseTiddler(this.widgetTreeTitle,{parseAsInline: this.widgetTreeInlineMode}),
		results;
	if(parser) {
		var widgetNode = this.wiki.makeWidget(parser,{
				parentWidget: this
			}),
			container = $tw.fakeDocument.createElement("div"),
			copyNode = function(widgetNode,resultNode) {
				var type = widgetNode.parseTreeNode.type;
				if(type == "transclude") {
						// Each transcluded tiddler displays a listitem link to that tiddler
						var node = {
							type: "element",
							tag: "li",
							children: [
								{
									type: "link",
									attributes: {to: {type: "string", value: widgetNode.transcludeTitle}},
									children: [
										{
											type: "text",
											text: widgetNode.transcludeTitle
										}
									]
								},
								{
									type: "element",
									tag: "ul",
									children: []
								}
							]
						};
						resultNode.children.push(node);
						// Attach descendant transclusions to the 'ul' section
						resultNode=node.children[1];
				}
				if(Object.keys(widgetNode.children || {}).length > 0) {
						$tw.utils.each(widgetNode.children,function(widgetChildNode) {
								copyNode(widgetChildNode,resultNode);
						});
				}
			};
		widgetNode.render(container,null);
		results = {"type": "element", "tag": "ul", "children": []};
		copyNode(widgetNode,results);
	}
	this.makeChildWidgets([results]);
};

/*
Selectively refreshes the widget if needed. Returns true if the widget or any of its children needed re-rendering
*/
TransclusionTreeWidget.prototype.refresh = function(changedTiddlers) {
	var changedAttributes = this.computeAttributes();
	// Completely rerender if any of our attributes have changed
	if(changedAttributes.tiddler || changedAttributes.mode || changedTiddlers[this.widgetTreeTitle]) {
		this.refreshSelf();
		return true;
	}
	return false;
};

exports["transclusion-tree"] = TransclusionTreeWidget;

})();
