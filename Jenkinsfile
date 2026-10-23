/*
 * AppDock 前端发布流水线
 *
 * 依赖：Jenkins 节点可以执行 docker（不需要在节点上安装 node/pnpm，质量门禁在镜像构建阶段执行）。
 * 产物：<IMAGE_REPOSITORY>:<tag>；可选 <IMAGE_REPOSITORY>:<tag>-debug（dist-debug，仅内网使用）。
 *
 * 首次使用前请确认：
 * 1. 有可用的 docker 凭据（默认 ID：docker-registry）；
 * 2. IMAGE_REPOSITORY 指向你的镜像仓库（如 registry.example.com/frontend/app-dock）；
 * 3. BUILD_SCRIPT 与项目的 Vite mode 对应（build / build:mock / build:supabase）。
 */
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '15', artifactNumToKeepStr: '5'))
    timeout(time: 40, unit: 'MINUTES')
  }

  parameters {
    choice(
      name: 'BUILD_SCRIPT',
      choices: ['build:mock', 'build', 'build:supabase'],
      description: 'pnpm 构建脚本，对应 Vite mode（mock / production / supabase）'
    )
    string(
      name: 'IMAGE_REPOSITORY',
      defaultValue: 'app-dock',
      description: '镜像名，建议带仓库地址与命名空间，如 registry.example.com/frontend/app-dock'
    )
    string(
      name: 'IMAGE_TAG',
      defaultValue: '',
      description: '镜像 tag，留空则使用 git short SHA'
    )
    string(
      name: 'REGISTRY_URL',
      defaultValue: '',
      description: '镜像仓库地址（如 https://registry.example.com），留空表示 Docker Hub'
    )
    string(
      name: 'DOCKER_CREDENTIALS_ID',
      defaultValue: 'docker-registry',
      description: 'Jenkins 中镜像仓库凭据 ID（用户名/密码）'
    )
    booleanParam(name: 'PUSH_IMAGE', defaultValue: true, description: '构建后推送镜像')
    booleanParam(
      name: 'BUILD_DEBUG_IMAGE',
      defaultValue: false,
      description: '额外构建可调试镜像（不压缩、不混淆、带 sourcemap，仅内网使用）'
    )
  }

  environment {
    DOCKER_BUILDKIT = '1'
  }

  stages {
    stage('Prepare') {
      steps {
        script {
          env.GIT_SHORT_SHA = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
          env.IMAGE_TAG_FINAL = params.IMAGE_TAG?.trim() ? params.IMAGE_TAG.trim() : env.GIT_SHORT_SHA
          env.APP_IMAGE = "${params.IMAGE_REPOSITORY}:${env.IMAGE_TAG_FINAL}"
          echo "本次镜像：${env.APP_IMAGE}"
        }
      }
    }

    stage('Verify') {
      steps {
        sh """
          docker build --pull \
            --target verify \
            --build-arg BUILD_SCRIPT=${params.BUILD_SCRIPT} \
            --tag ${env.APP_IMAGE}-verify \
            --file Dockerfile \
            .
        """
      }
    }

    stage('Build image') {
      steps {
        sh """
          docker build \
            --build-arg BUILD_SCRIPT=${params.BUILD_SCRIPT} \
            --tag ${env.APP_IMAGE} \
            --file Dockerfile \
            .
        """
      }
    }

    stage('Build debug image') {
      when { expression { params.BUILD_DEBUG_IMAGE } }
      steps {
        sh """
          docker build \
            --build-arg BUILD_SCRIPT=${params.BUILD_SCRIPT} \
            --target debug \
            --tag ${env.APP_IMAGE}-debug \
            --file Dockerfile \
            .
        """
      }
    }

    stage('Smoke test') {
      steps {
        sh '''#!/bin/sh
          set -eu
          container="app-dock-smoke-${BUILD_NUMBER}"
          cleanup() { docker rm -f "$container" >/dev/null 2>&1 || true; }
          trap cleanup EXIT
          cleanup

          docker run -d --name "$container" -p 0:80 "$APP_IMAGE" >/dev/null
          port=$(docker inspect -f '{{(index (index .NetworkSettings.Ports "80/tcp") 0).HostPort}}' "$container")

          for attempt in 1 2 3 4 5; do
            if curl -fsS "http://127.0.0.1:${port}/healthz" >/dev/null 2>&1; then break; fi
            sleep 2
          done

          curl -fsS "http://127.0.0.1:${port}/healthz"
          curl -fsS -o /dev/null -w 'index.html: %{http_code}\n' "http://127.0.0.1:${port}/"
          curl -fsS -o /dev/null -w 'app-icons.svg: %{http_code}\n' "http://127.0.0.1:${port}/app-icons.svg"
        '''
      }
    }

    stage('Push') {
      when { expression { params.PUSH_IMAGE } }
      steps {
        script {
          def registryUrl = params.REGISTRY_URL?.trim() ?: 'https://index.docker.io/v1/'
          docker.withRegistry(registryUrl, params.DOCKER_CREDENTIALS_ID.trim()) {
            docker.image(env.APP_IMAGE).push()
            if (params.BUILD_DEBUG_IMAGE) {
              docker.image("${env.APP_IMAGE}-debug").push()
            }
          }
        }
      }
    }
  }

  post {
    success {
      echo "构建完成：${env.APP_IMAGE}${params.BUILD_DEBUG_IMAGE ? ' / ' + env.APP_IMAGE + '-debug' : ''}"
    }
    failure {
      echo "构建失败，日志：${env.BUILD_URL}console"
    }
  }
}
