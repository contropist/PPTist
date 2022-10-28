import { ref, computed, onMounted, onUnmounted, Ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useMainStore, useSlidesStore } from '@/store'
import { VIEWPORT_SIZE } from '@/configs/canvas'

export default (canvasRef: Ref<HTMLElement | undefined>) => {
  const viewportLeft = ref(0)
  const viewportTop = ref(0)

  const mainStore = useMainStore()
  const { canvasPercentage, canvasDragged } = storeToRefs(mainStore)
  const { viewportRatio } = storeToRefs(useSlidesStore())

  // 初始化画布可视区域的位置
  const initViewportPosition = () => {
    if (!canvasRef.value) return
    const canvasWidth = canvasRef.value.clientWidth
    const canvasHeight = canvasRef.value.clientHeight

    if (canvasHeight / canvasWidth > viewportRatio.value) {
      const viewportActualWidth = canvasWidth * (canvasPercentage.value / 100)
      mainStore.setCanvasScale(viewportActualWidth / VIEWPORT_SIZE)
      viewportLeft.value = (canvasWidth - viewportActualWidth) / 2
      viewportTop.value = (canvasHeight - viewportActualWidth * viewportRatio.value) / 2
    }
    else {
      const viewportActualHeight = canvasHeight * (canvasPercentage.value / 100)
      mainStore.setCanvasScale(viewportActualHeight / (VIEWPORT_SIZE * viewportRatio.value))
      viewportLeft.value = (canvasWidth - viewportActualHeight / viewportRatio.value) / 2
      viewportTop.value = (canvasHeight - viewportActualHeight) / 2
    }
  }
  // 计算画布可视区域的位置
  const setViewportPosition = (newValue: number[], oldValue: number[]) => {
    console.log(newValue, oldValue)
    if (!canvasRef.value || !newValue || !newValue.length || !oldValue || !oldValue.length) return
    const canvasWidth = canvasRef.value.clientWidth
    const canvasHeight = canvasRef.value.clientHeight
    // change canvasPercentage
    if (newValue[0] !== oldValue[0]) {
      const newViewportActualWidth = canvasWidth * (newValue[0] / 100)
      const oldViewportActualWidth = canvasWidth * (oldValue[0] / 100)
      const newViewportActualHeight = canvasHeight * (newValue[0] / 100)
      const oldViewportActualHeight = canvasHeight * (oldValue[0] / 100)
      mainStore.setCanvasScale(newViewportActualWidth / VIEWPORT_SIZE)
      viewportLeft.value = viewportLeft.value - (newViewportActualWidth - oldViewportActualWidth) / 2
      viewportTop.value = viewportTop.value - (newViewportActualHeight - oldViewportActualHeight) / 2
    } 
    else if (newValue[1] !== oldValue[1]) {
      // change viewportRatio
      if (canvasHeight / canvasWidth > viewportRatio.value) {
        const viewportActualWidth = canvasWidth * (canvasPercentage.value / 100)
        mainStore.setCanvasScale(viewportActualWidth / VIEWPORT_SIZE)
      }
      else {
        const viewportActualHeight = canvasHeight * (canvasPercentage.value / 100)
        mainStore.setCanvasScale(viewportActualHeight / (VIEWPORT_SIZE * viewportRatio.value))
      }
    }
  }

  // 可视区域缩放或比例变化时，更新可视区域的位置
  watch([canvasPercentage, viewportRatio], setViewportPosition)

  // 画布拖拽状态改变（复原）时，更新可视区域的位置
  watch(canvasDragged, () => {
    if (!canvasDragged.value) initViewportPosition()
  })

  // 画布可视区域位置和大小的样式
  const viewportStyles = computed(() => ({
    width: VIEWPORT_SIZE,
    height: VIEWPORT_SIZE * viewportRatio.value,
    left: viewportLeft.value,
    top: viewportTop.value,
  }))

  // 监听画布尺寸发生变化时，更新可视区域的位置
  const resizeObserver = new ResizeObserver(initViewportPosition)

  onMounted(() => {
    if (canvasRef.value) resizeObserver.observe(canvasRef.value)
  })
  onUnmounted(() => {
    if (canvasRef.value) resizeObserver.unobserve(canvasRef.value)
  })

  // 拖拽画布
  const dragViewport = (e: MouseEvent) => {
    let isMouseDown = true

    const startPageX = e.pageX
    const startPageY = e.pageY

    const originLeft = viewportLeft.value
    const originTop = viewportTop.value

    document.onmousemove = e => {
      if (!isMouseDown) return

      const currentPageX = e.pageX
      const currentPageY = e.pageY

      viewportLeft.value = originLeft + (currentPageX - startPageX)
      viewportTop.value = originTop + (currentPageY - startPageY)
    }

    document.onmouseup = () => {
      isMouseDown = false
      document.onmousemove = null
      document.onmouseup = null

      mainStore.setCanvasDragged(true)
    }
  }

  return {
    viewportStyles,
    dragViewport,
  }
}