/*
* Copyright © 2024. Cloud Software Group, Inc.
* This file is subject to the license terms contained
* in the license file that is distributed with this file.
*/

class Plotly3DCombinedDiagram {
    static DEFAULT_COLOR = '#FAA264';

    constructor(canvasElem, actions) {
        this.canvasElem = canvasElem;
        this.actions = actions;
        this.initialDraw = false;
    }

    // Draw diagram
    draw(groupMap, configuration) {
        this.configuration = configuration;
        this.groupMap = groupMap;

        let canvasElem = this.canvasElem;
        let data = this.buildData(groupMap);

        // Race condition nonsense
        let self = this;
        setTimeout(function() {
            // Create new plot or update existing plot if exists
            Plotly.react(canvasElem, data, plotlyConfiguration.layout, plotlyConfiguration.options);

            if(self.initialDraw == false) {
                //console.log('initial draw');
                self.configureEventHandlers();
                self.initialDraw = true;
            }
        },100);
    }

    // Configure plotly event handlers
    configureEventHandlers() {
        let canvasElem = this.canvasElem;

        // Workaround to catch plotly clicks
        let clickPoints = null;

        // Catch plotly clicks and set to an object,
        canvasElem.on('plotly_click', function(event) {
            clickPoints = event.points;
        });

        // Detect move vs click so that rotate and pan actions do not unmark
        let startPoint = null; 
        let minDelta = 5;

        // Mouse down listener
        // Set starting point for the mouse action
        const downListener = function(event) {
            startPoint = [event.pageX, event.pageY];
        };

        // Mouse up listener
        // Calculate mouse movement. If less than minDelta in both 
        //   axes then it will be a click.
        const upListener = function(event) {
            let dx = Math.abs(event.pageX - startPoint[0]);
            let dy = Math.abs(event.pageY - startPoint[1]);
            if(dx < minDelta && dy < minDelta) {
                selectPoints(event)
            }
        };

        // When click is detected, mark clicked points or unmark everything
        let self = this;
        const selectPoints = function(event) {
            event.stopPropagation();
            if(clickPoints != null) {
                for(let idx = 0; idx < clickPoints.length; idx++) {
                    let thisPoint = clickPoints[idx];
                    if(thisPoint.data.rows != null) {                            
                        let row = thisPoint.data.rows[thisPoint.pointNumber];
                        if(event.ctrlKey == true)
                            row.mark("Toggle");
                        else
                            row.mark("Replace");
                    }
                }
                clickPoints = null;
            }
            else {
                self.actions.clearAllMarking();
            }
        };

        // Attach listeners
        canvasElem.addEventListener('mousedown', downListener)
        canvasElem.addEventListener('mouseup', upListener)

    }

    // Build data array of series from groupMap
    buildData(groupMap) {
        let data = [];

        // Iterate over groups and convert data arrays
        for(let thisGroupName in groupMap) {
            let thisGroup = groupMap[thisGroupName];
            let thisSeries = this.groupToSeries(thisGroup);
            if(thisSeries != null) {
                data.push(thisSeries);
            }
        }

        return data;
    }

    // Convert a group into a series
    groupToSeries(group) {
        let rawData = group.data;
        let series = null;

        if(group.type == 'surface') {
            series = this.configureSurface(rawData);
        }
        else if(group.type == 'scatter') {
            series = this.configureScatter3d(rawData, group.mode); 
        }
        else {
            console.log('Unknown group type ' + group.type);
            return null;
        }

        // Set series name
        series.name = group.name + "<br>" + (group.label != null ? group.label : '');
        series.showlegend = false;

        return series;
    }

    // Configure a Scatter 3d plot
    configureScatter3d(rawData, rawMode) {
        let mode = this.configuration.hasDisplayModeData ? rawMode : this.configuration.mode;
        let converted = this.dataToArrays(rawData, mode);
        let series = {
            x: converted.x,
            y: converted.y,
            z: converted.z,
            type: 'scatter3d',
            mode: mode,
            rows: converted.rows
        }

        // Check the line mode
        if(series.mode.indexOf('lines') > -1) {
            series.line = {
                width: this.configuration.hasSizeData ? converted.sizes[0] : this.configuration.lineWidth,
                color: this.configuration.hasColorData ? converted.colors : Plotly3DCombinedDiagram.DEFAULT_COLOR
            }
        }

        // Check the marker mode
        if(series.mode.indexOf('markers') > -1) {   
            series.marker = {
                size: this.configuration.hasSizeData ? converted.sizes : this.configuration.markerSize,
                symbol: this.configuration.hasSymbolData ? converted.symbols : this.configuration.markerSymbol,
                color: this.configuration.hasColorData ? converted.colors : Plotly3DCombinedDiagram.DEFAULT_COLOR
            }

            if(this.configuration.markerLineEnabled == true) {
                series.marker.line = {
                    color: this.configuration.markerLineColor,
                    width: this.configuration.markerLineWidth
                }
            }
        }

        return series;
    }

    // Configure a 3d surface
    configureSurface(rawData) {
        let converted = this.dataToMatrix(rawData);
        let series = {
            x: converted.x,
            y: converted.y,
            z: converted.z,
            type: 'surface',
            opacity: this.configuration.surfaceOpacity,
            showscale: false
        }

        // If colorAxisType is categorical, apply the cat color to the whole surface
        if(this.configuration.colorAxisType == 'categorical') {
            series.colorscale = [[0, 'white'], [1, converted.catColor]];
        }
        // If colorAxisType is continuous, apply the color array and set the color scale
        else if(this.configuration.colorAxisType == 'continuous') {
            series.surfacecolor = converted.colorValues;
            series.colorscale = [[0, converted.minColor], [1, converted.maxColor]];
        }
        // Otherwise apply default color
        else {
            series.colorscale = [[0, 'white'], [1, '#FAA264']];
        }

        return series;
    }

    // Convert a data array into a matrix for 3d surface
    dataToMatrix(data) {
        // Extract unique X and Y variables into arrays
        let x = [];
        let y = [];
        let z = [];
        let colors = [];
        let colorValues = [];
        let catColor = null;

        let minVal = Number.MAX_SAFE_INTEGER;
        let maxVal = Number.MIN_SAFE_INTEGER;
        let minColor = null;
        let maxColor = null;

        for(let idx = 0; idx < data.length; idx++) {
            let thisData = data[idx];
            let thisX = thisData.x;
            if(x.indexOf(thisX) == -1)
                x.push(thisX);
            let thisY = thisData.y;
            if(y.indexOf(thisY) == -1)
                y.push(thisY);

            if(this.configuration.colorAxisType == 'continuous') {
                if(thisData.colorValue < minVal) {
                    minVal = thisData.colorValue;
                    minColor = thisData.color;
                }
                if(thisData.colorValue > maxVal) {
                    maxVal = thisData.colorValue;
                    maxColor = thisData.color;
                }
            }
            else {
                catColor = thisData.color;
            }
        }

        // Sort arrays
        x.sort(function(a, b) { return a - b });
        y.sort(function(a, b) { return a - b });    
        
        // Extract x variable and position in matrix
        for(let idx = 0; idx < data.length; idx++) {
            let thisX = data[idx].x;
            let thisY = data[idx].y;
            let thisZ = data[idx].z;
            let thisColor = data[idx].color;
            let thisColorValue = data[idx].colorValue;

            // Get coordinates of x and y
            let xIdx = x.indexOf(thisX);
            let yIdx = y.indexOf(thisY);

            // Insert into matrix
            if(z[yIdx] == null) {
                z[yIdx] = new Array(y.length).fill(null);
            }
            z[yIdx][xIdx] = thisZ;

            // Insert colors into matrix
            if(colors[yIdx] == null) {
                colors[yIdx] = new Array(y.length).fill(null);
            }
            colors[yIdx][xIdx] = thisColor;

            // Insert color value into matrix
            if(colorValues[yIdx] == null) {
                colorValues[yIdx] = new Array(y.length).fill(null);
            }
            colorValues[yIdx][xIdx] = thisColorValue;
        }

        let series = {
            x: x,
            y: y,
            z: z,
            colors: colors,
            colorValues: colorValues,
            minColor: minColor,
            maxColor: maxColor,
            catColor: catColor
        }

        return series;
    }

    // Convert a data array into a set of data arrays for 3d line/markers
    dataToArrays(data, mode) {
        let x = [];
        let y = [];
        let z = [];
        let colors = [];
        let colorValues = [];
        let symbols = [];
        let sizes = [];
        let rows = [];

        // Sort data by orderBy
        data.sort(function(a, b){ return b.orderBy - a.orderBy; });
        
        for(let idx = 0; idx < data.length; idx++) {
            let thisData = data[idx];
            x.push(thisData.x);
            y.push(thisData.y);
            z.push(thisData.z);

            colors.push(thisData.color);
            colorValues.push(thisData.colorValue);
            symbols.push(thisData.symbol);
            sizes.push(thisData.size);
            rows.push(thisData.row);
        }

        let converted = {
            x: x,
            y: y,
            z: z,
            colors: colors,
            colorValues: colorValues,
            symbols: symbols,
            sizes: sizes,
            rows: rows
        }

        return converted;
    }

    // Clear marking
    clearMarking() {
        let groupMap = this.groupMap;

        // Iterate over groups
        for(let thisGroupName in groupMap) {
            let thisGroup = groupMap[thisGroupName];

            // Ignore anything that isn't scatter
            if(thisGroup.type != 'scatter') continue;

            // Iterate over data and unmark
            for(let thisPoint of thisGroup.data) {
                thisPoint.row.mark('Subtract');
            }
        }
    }
}