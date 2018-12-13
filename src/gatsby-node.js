const { forEach } = require('p-iteration')
const fetch = require('node-fetch')
const queryString = require('query-string')

exports.sourceNodes = async (
  { actions, createNodeId, createContentDigest },
  configOptions
) => {
  const { createNode } = actions

  // Gatsby adds a configOption that's not needed for this plugin, delete it
  delete configOptions.plugins

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

  const apiUrl = `${configOptions.apiURL}`

  let headers = new fetch.Headers()
  headers.append('Authorization', `Bearer ${configOptions.key}`)

  let contentTypes = [
    {
      description: 'projects',
      url: 'projects',
      slug: 'project',
    },
    {
      description: 'pages',
      url: `projects/${process.env.PROJECT_SLUG}/pages`,
      slug: 'page',
    },
    {
      description: 'languages',
      url: 'languages',
      slug: 'language',
    },
  ]

  const response = await fetch(`${apiUrl}/content-types`, { headers: headers })
  data = await response.json()
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
    contentTypeData.forEach(item => {
      item.entity = contentType.slug
      const nodeData = processEntity(item)
      createNode(nodeData)
    })
  }
  return
}
