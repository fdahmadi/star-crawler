import router from '@adonisjs/core/services/router'

const EpssController = () => import('#controllers/epss_controller')

router.get('/', async () => {
  return { status: 'ok', service: 'star-crawler' }
})

router.get('/epss', [EpssController, 'index'])
router.post('/epss', [EpssController, 'index'])
