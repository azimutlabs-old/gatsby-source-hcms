# gatsby-source-hcms

Source plugin for pulling documents into Gatsby from a hCMS API.

## Install

`npm install --save gatsby-source-hcms`

## How to use

```javascript
// In your gatsby-config.js
plugins: [
  {
    resolve: `gatsby-source-hcms`,
    options: {
      apiURL: `http://localhost:8080/api/v1`,
      // JWT to authenticate with
      key: 'secret'
    },
  },
]
```

## How to query

You can query Document nodes created from your hCMS API like the following:

```graphql
{
  allHcmsPage {
    edges {
      node {
        title
        slug
      }
    }
  }
}
```
