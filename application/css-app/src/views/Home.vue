<template>
  <div>
    <h3>渐变的圆角边框</h3>
    <p>
      我们知道，虽然 css 有 border-image 属性，但它与 border-radius 是冲突的。
    </p>
    <div class="gradient-border"></div>
  </div>
</template>

<script lang="ts" setup>
console.log(6666)
</script>

<style lang="less" scoped>
.gradient-border {
  width: 150px;
  height: 200px;
  padding: 1.875em;
  position: relative;

  background: linear-gradient(
    120deg,
    rgba(139, 126, 254, 0.8) 0%,
    rgba(6, 6, 18, 0.3) 57%
  );

  border-image: linear-gradient(
      139deg,
      rgba(166, 237, 255, 0.26),
      rgba(104, 90, 255, 1)
    )
    1 1;
  border-radius: 16px;

  cursor: pointer;
  transition: flex-basis 0.1s linear;

  &:hover {
    width: 180px;
    border: 2px solid transparent;
    background-clip: padding-box, border-box !important;
    background-origin: padding-box, border-box !important;
    background:
      linear-gradient(148deg, #020a32 0%, #1e2852 51%, #010931 100%),
      linear-gradient(
        125deg,
        rgba(192, 105, 255, 1),
        rgba(55, 49, 119, 1),
        rgba(48, 110, 255, 1)
      );
    box-shadow:
      2px 2px 6px 0px rgba(176, 176, 176, 0.2),
      7px 8px 11px 0px rgba(176, 176, 176, 0.17),
      15px 18px 14px 0px rgba(176, 176, 176, 0.1),
      27px 33px 17px 0px rgba(176, 176, 176, 0.03),
      42px 51px 19px 0px rgba(176, 176, 176, 0);

    .advantages-flex-item__icon {
      right: 1em;
      bottom: 1em;
      transform: translateX(-5%) scale(1.2);

      img {
        filter: none;
      }
    }
  }
}
</style>
