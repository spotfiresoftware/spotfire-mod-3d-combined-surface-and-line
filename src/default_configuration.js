/*
 * Copyright © 2024. Cloud Software Group, Inc.
 * This file is subject to the license terms contained
 * in the license file that is distributed with this file.
 */

/* This object is used to populate the default configuration on mod creation into the mod properties. */
const defaultConfiguration = {
    "rowLimit": 20000,
    "trellisDirection": "Columns",
    "maxTrellisCount": 10,
    "plotly": {
        "surface": {
        },
        "scatter3d": {
            "lineWidth": 2,
            "markerLineEnabled": true,
            "markerLineColor": "black",
            "markerLineWidth": 1,
            "markerSize": 4,
            "markerSymbol": "circle",
            "mode": "lines"
        }
    }

}
