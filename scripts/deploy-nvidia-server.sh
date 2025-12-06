#!/bin/bash

# Deploy script for Predator Analytics on NVIDIA Server using Helm

NAMESPACE="predator"
RELEASE_NAME="predator"
CHART_PATH="helm/predator-umbrella"
VALUES_FILE="helm/predator-umbrella/values.yaml"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function show_help {
    echo "Usage: ./deploy-nvidia-server.sh [command]"
    echo ""
    echo "Commands:"
    echo "  install    Install or upgrade the Helm release"
    echo "  uninstall  Uninstall the Helm release"
    echo "  dry-run    Simulate an installation to see generated manifests"
    echo "  status     Check the status of the release"
    echo ""
}

function check_helm {
    if ! command -v helm &> /dev/null; then
        echo -e "${RED}Error: helm could not be found. Please install Helm.${NC}"
        exit 1
    fi
}

function check_kubectl {
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}Error: kubectl could not be found. Please install kubectl.${NC}"
        exit 1
    fi
}

function install {
    echo -e "${YELLOW}Updating Helm dependencies...${NC}"
    helm dependency update $CHART_PATH

    echo -e "${YELLOW}Deploying $RELEASE_NAME to namespace $NAMESPACE...${NC}"
    helm upgrade --install $RELEASE_NAME $CHART_PATH \
        -f $VALUES_FILE \
        --namespace $NAMESPACE \
        --create-namespace \
        --wait \
        --timeout 10m

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment successful!${NC}"
        echo -e "${GREEN}Access services via Ingress or NodePort.${NC}"
    else
        echo -e "${RED}Deployment failed.${NC}"
        exit 1
    fi
}

function uninstall {
    echo -e "${YELLOW}Uninstalling $RELEASE_NAME from namespace $NAMESPACE...${NC}"
    helm uninstall $RELEASE_NAME --namespace $NAMESPACE

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Uninstallation successful!${NC}"
    else
        echo -e "${RED}Uninstallation failed.${NC}"
        exit 1
    fi
}

function dry_run {
    echo -e "${YELLOW}Running dry-run for $RELEASE_NAME...${NC}"
    helm dependency update $CHART_PATH
    helm upgrade --install $RELEASE_NAME $CHART_PATH \
        -f $VALUES_FILE \
        --namespace $NAMESPACE \
        --create-namespace \
        --dry-run --debug
}

function status {
    echo -e "${YELLOW}Checking status for $RELEASE_NAME...${NC}"
    helm status $RELEASE_NAME --namespace $NAMESPACE
    echo ""
    echo -e "${YELLOW}Pod Status:${NC}"
    kubectl get pods -n $NAMESPACE
}

# Main execution
check_helm
check_kubectl

case "$1" in
    install)
        install
        ;;
    uninstall)
        uninstall
        ;;
    dry-run)
        dry_run
        ;;
    status)
        status
        ;;
    *)
        show_help
        exit 1
        ;;
esac
