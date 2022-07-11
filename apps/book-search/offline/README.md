## Book Finder: Offline Processing

### Data Storage

The records looks like (less than 400 byts per book, and could reduce that--don't need
all that precision in `X` and `Y`):
```json
{
  "TextDetections": [
    {
      "DetectedText": "Almost Vegetarian",
      "Type": "LINE",
      "Geometry": {
        "Polygon": [
          { "X": 0.2913122773170471, "Y": 0.45773550868034363 },
          { "X": 0.3072223961353302, "Y": 0.5984686017036438 },
          { "X": 0.2840229868888855, "Y": 0.6010913252830505 },
          { "X": 0.2681128680706024, "Y": 0.46035823225975037 }
        ]
      }
    }
  ]
}
```json

Need a tool to merge multiple JSON files.

### Database Alternatives

DynamoDB: No unique key. Text substring search requires a scan. Will be slow.

Aurora Serverles: SQL. Can do substring search. Not really serverless--minimum monthly charge 
of around $40 to keep server active.

DocumentDB: MongoDB clone. Would be good, but again not serverless. Minimum charge for server.

CloudSearch: Can index everything and do Google-type searches. Close enough searchs, etc. 
Index can be updated using a lambda for new data. No free plan. Costs.

EFS: This is cheap and should work well, but must deal with VPC and getting lambda into same
VPC as EFS. Still may be a server charge.

Raw JSON data: This is the best approach. 300 books (300 * 400 = 120KB) 
means small amount of data. Could just
load it into lambda as part of `node_modules` or put it in a lambda layer. Found a post
on the web where a guy uses lambda layers to store small hash tables for rapid search.
This is the same approach.