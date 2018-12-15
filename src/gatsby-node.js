const fetch = require('node-fetch')
const queryString = require('query-string')

/**
 *  This override will try to fetch data as tree
 *
 *  Mussabekov Daniyar
 */

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  configOptions,
) => {
  const { createNode } = actions
  
  console.log('!!!STARTED HCMS!!!!')
  
  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins

  // Setting root url to API
  const apiUrl = `${configOptions.apiURL}`
  // Setting Authorization token for API
  let headers = new fetch.Headers()
  headers.append('Authorization', `Bearer ${configOptions.key}`)


  /**
   * This method will try to create data for GraphQL nodes
   * @param entity JSON object data fetched from API
   * @returns {any} JSON object if node
   */
  const processEntity = entity => {
    const nodeId = createNodeId(`hcms-${entity.entity}-${entity.id}`)
    const nodeContent = JSON.stringify(entity)

    const nodeData = Object.assign({}, entity, {
      id: nodeId,
      parent: null,
      children: [],
      internal: {
        type:
          'Hcms' +
          entity.entity.charAt(0).toUpperCase() +
          entity.entity.slice(1),
        content: nodeContent,
        contentDigest: createContentDigest(entity),
      },
    })

    return nodeData
  }


  // These are content types which were created aside from
  // dynamically added content types
  let contentTypes = [
    {
      description: 'projects',
      url: 'projects/tree',
      slug: 'project',
    },
    {
      description: 'categories',
      url: 'categories/tree',
      slug: 'categories',
    },
    {
      description: 'pages',
      url: `projects/${process.env.PROJECT_SLUG}/pages/tree`,
      slug: 'page',
    },
    {
      description: 'languages',
      url: 'languages',
      slug: 'language',
    },
  ]

  const response = await fetch(`${apiUrl}/content-types`, { headers: headers })
  let data = await response.json()
  data = contentTypes.concat(data)
  for (let index = 0; index < data.length; index++) {
    let contentType = data[index]
    console.log(`Fetching "${contentType.description}" ...`)
    if ('id' in contentType) {
      contentType.url = `content-manager/${contentType.slug}`
    }
    const contentTypeResponse = await fetch(`${apiUrl}/${contentType.url}`, {
      headers: headers,
    })
    const contentTypeData = await contentTypeResponse.json()
    for (let ctIndex = 0; ctIndex < contentTypeData.length; ctIndex++) {
      let item = contentTypeData[ctIndex]
      item.entity = contentType.slug
      const nodeData = processEntity(item)
      createNode(nodeData)
    }
  }
  return
}
