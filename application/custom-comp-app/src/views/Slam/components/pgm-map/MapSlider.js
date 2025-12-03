class MapSlider extends HTMLElement {
  currentValue = 1

  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })

    shadow.innerHTML = `
      <style>
        .map-slider {
          width: 160px;
          height: 32px;
          background: #45494D;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(153, 153, 153, 0.25);
          display: flex;
          justify-content: center;
          align-items: center;
          color: #fff;
          padding: 0 16px;
          font-weight: 700;
          gap: 12px;
        }
        
        .btn {
          cursor: pointer;
          font-style: normal;
          font-size: 20px;
        }

        .slider {
          flex: 1;
        }

        input[type="range"] {
          width: 100%;
          cursor: pointer;
        }
      </style>

      <div class="map-slider">
        <span class="btn btn-minus">-</span>
        <div class="slider">
          <input type="range" />
        </div>
        <span class="btn btn-plus">+</span>
      </div>
    `
  }

  static get observedAttributes() {
    return ['value', 'min', 'max', 'step']
  }

  connectedCallback() {
    const input = this.shadowRoot.querySelector('input')
    const minus = this.shadowRoot.querySelector('.btn-minus')
    const plus = this.shadowRoot.querySelector('.btn-plus')

    input.addEventListener('input', (e) =>
      this.updateValue(parseFloat(e.target.value)),
    )
    minus.addEventListener('click', () => this.changeByStep(-1))
    plus.addEventListener('click', () => this.changeByStep(1))

    this.applyAttributes()
  }

  attributeChangedCallback() {
    this.applyAttributes()
  }

  applyAttributes() {
    const input = this.shadowRoot.querySelector('input')

    const value = this.getAttribute('value') ?? '1'
    const min = this.getAttribute('min') ?? '1'
    const max = this.getAttribute('max') ?? '5'
    const step = this.getAttribute('step') ?? '0.5'

    input.value = value
    input.min = min
    input.max = max
    input.step = step

    this.currentValue = parseFloat(value)
  }

  updateValue(val) {
    this.currentValue = val
    this.setAttribute('value', String(val))

    // 派发事件
    this.dispatchEvent(new CustomEvent('change', { detail: val }))
  }

  changeByStep(dir) {
    const step = parseFloat(this.getAttribute('step') ?? '0.5')
    const min = parseFloat(this.getAttribute('min') ?? '1')
    const max = parseFloat(this.getAttribute('max') ?? '5')

    const next = Math.min(max, Math.max(min, this.currentValue + dir * step))
    this.updateValue(next)
  }
}

customElements.define('map-slider', MapSlider)
