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

  console.log('Started Fetching from HCMS')

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
   * @param parentId ID of higher parent node
   * @returns {Array} JSON Array of NodeData
   */
  const processEntity = (entity, parentId) => {
    const nodeId = createNodeId(`hcms-${entity.entity}-${entity.id}`)


    // This is array of Nodes that should be created
    let nodeArray = []

    /*
    Node type is created by value of its entity
    
    if entity name is category then it will be turned into HcmsCategory,
    
    which will be accessed as allHcmsCategory in GraphQL
     */
    const type = 'Hcms' +
      entity.entity.charAt(0).toUpperCase() +
      entity.entity.slice(1)

    /*
    If this entity has children we must recursively create NodeData 
    array from them 
     */
    let children = entity.children
    let childIds = []
    delete entity.children
    if (children) {
      for (let i = 0; i < children.length; i++) {
        let entityChild = children[i]

        entityChild.entity = entity.entity;

        nodeArray = nodeArray.concat(processEntity(entityChild, nodeId))
      }
    }

    for (let i = 0; i < nodeArray.length; i++)
      childIds.push(nodeArray[i].id)

    const nodeContent = JSON.stringify(entity)
    const nodeData = Object.assign({}, entity, {
      id: nodeId,
      parent: parentId,
      children: childIds,
      internal: {
        type: type,
        content: nodeContent,
        contentDigest: createContentDigest(entity),
      },
    })

    nodeArray.push(nodeData)
    
    return nodeArray //nodeArray.reverse()
  }


  /* These are content types which were created aside from
     dynamically added content types */
  let contentTypes = [
    {
      description: 'projects',
      url: 'projects',
      slug: 'projects',
    },
    {
      description: 'categories',
      url: 'categories/tree',
      slug: 'categories',
    },
    {
      description: 'pages',
      url: `projects/${process.env.PROJECT_SLUG}/pages/tree`,
      slug: 'pages',
    },
    {
      description: 'languages',
      url: 'languages',
      slug: 'languages',
    },
  ]

  // We must fetch data that was generated dynamically
  const response = await fetch(`${apiUrl}/content-types`, { headers: headers })
  let data = await response.json()
  data = contentTypes.concat(data)

  // This is all nodes that will be created
  let nodesData = []

  for (let index = 0; index < data.length; index++) {
    let contentType = data[index]
    console.log(`Fetching "${contentType.description}" ...`)

    /* 
    If this content type has id in its JSON object
    it is dynamically created data its url should be fetched from
    content-manager/slug path 
    */
    if ('id' in contentType) {
      contentType.url = `content-manager/${contentType.slug}`
    }

    const contentTypeResponse = await fetch(`${apiUrl}/${contentType.url}`, {
      headers: headers,
    })
    const contentTypeData = await contentTypeResponse.json()


    for (let ctIndex = 0; ctIndex < contentTypeData.length; ctIndex++) {
      let item = contentTypeData[ctIndex]
      
      item.entity = contentType.slug;
      
      nodesData = nodesData.concat(processEntity(item, null))
    }
  }


  // Finally we are creating nodes
  for (let nodeIndex = 0; nodeIndex < nodesData.length; nodeIndex++) {
    createNode(nodesData[nodeIndex])
  }
  console.log('FINISHED')
}
