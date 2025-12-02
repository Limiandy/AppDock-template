<template>
  <div class="map-slider">
    <i class="el-icon-minus" @click="handleMinus"></i>
    <div style="flex: 1; min-width: 0; min-height: 0">
      <el-slider
        :value="currentValue"
        :min="min"
        :max="max"
        :step="step"
        :show-tooltip="false"
        @input="handleChange"
      />
    </div>
    <i class="el-icon-plus" @click="handlePlus"></i>
  </div>
</template>

<script>
export default {
  name: 'MapSlider',
  props: {
    value: { type: Number, default: 1 },
    min: { type: Number, default: 1 },
    max: { type: Number, default: 5 },
    step: { type: Number, default: 0.5 },
    canvas: { type: Object }, // 直接传 Canvas
  },
  data() {
    return { currentValue: this.value }
  },
  watch: {
    value(val) { this.currentValue = val },
  },
  methods: {
    handleChange(val) {
      this.currentValue = val
      if (this.canvas) this.canvas.setZoom(val)
      this.$emit('input', val)
    },
    handleMinus() { this.handleChange(Math.max(this.min, this.currentValue - this.step)) },
    handlePlus() { this.handleChange(Math.min(this.max, this.currentValue + this.step)) },
  },
}
</script>

<style lang="scss" scoped>
.map-slider {
  width: 160px;
  height: 32px;
  background: #45494D;
  border-radius: 4px;
  box-shadow: 0px 2px 4px 0px rgba(153,153,153,0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  padding: 0 16px;
  font-weight: 700;
  gap: 12px;

  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 999;

  i {
    cursor: pointer;
  }
}

::v-deep {
  .el-slider__runway {
    height: 4px;
    background: #8C939A;
    border-radius: 4px;
  }
  .el-slider__bar {
    height: 4px;
    border-radius: 4px;
    background-color: #6e7fff;
  }

  .el-slider__button-wrapper {
    top: -17px;
  }
  .el-slider__button {
    width: 14px;
    height: 14px;
    background: #FFFFFF;
    box-shadow: 0px 2px 4px 0px rgba(158,168,180,0.6);
    border: 1px solid #EEF2F6;
  }
}
</style>
