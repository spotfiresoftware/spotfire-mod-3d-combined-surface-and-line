/*
 * Copyright © 2024. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

const defaultConfigurationTemplate = {
    "label": "Display",
    "rowLimit": {
        "label": "Row Limit",
        "datatype": "int",
        "minVal": 0
    },
    "trellisDirection": {
        "label": "Trellis Direction",
        "datatype": "string",
        "enumeration": [
            "Rows",
            "Columns"
        ]
    },
    "maxTrellisCount": {
        "label": "Max Trellis Panel Count",
        "datatype": "int",
        "minVal": 0
    },
    "plotly": {
        "scatter3d": {
            "label": "Plotly Scatter 3D",
            "mode": {
                "label": "Display Mode",
                "datatype": "string",
                "axisOverride": "Display Mode",
                "enumeration": [
                    "lines",
                    "markers",
                    "lines+markers"
                ]
            },
            "lineWidth": {
                "label": "Line Width",
                "datatype": "integer",
                "minValue": 1,
                "axisOverride": "Size"
            },
            "markerLineEnabled": {
                "label": "Marker Outline Enabled",
                "datatype": "boolean"
            },
            "markerLineColor": {
                "label": "Marker Outline Color",
                "datatype": "string"
            },
            "markerLineWidth": {
                "label": "Marker Outline Width",
                "datatype": "integer",
                "minValue": 1
            },
            "markerSize": {
                "label": "Marker Size",
                "datatype": "integer",
                "minValue": 1,
                "axisOverride": "Size"
            },
            "markerSymbol": {
                "label": "Marker Symbol",
                "datatype": "string",
                "axisOverride": "Symbol",
                "enumeration": [
                    "circle",
                    "circle-open",
                    "cross",
                    "diamond",
                    "diamond-open",
                    "square",
                    "square-open",
                    "x"
                ]
            },
            "surfaceOpacity": {
                "label": "Surface Opacity",
                "datatype": "double",
                "minValue": 0.0,
                "maxValue": 1.0,
                "axisOverride": "Opacity"
            },
        }
    }

}
