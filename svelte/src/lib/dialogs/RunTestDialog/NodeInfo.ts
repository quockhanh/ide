import lodash from 'lodash';
import type { ISuiteInfo, ITestCaseInfo } from 'rockmelonqa.common/codegen/types';
import { Node } from '../../components/FileExplorer/Node';

export enum NodeType {
    Folder = 'Folder',
    Suite = 'Suite',
    Case = 'Case',
}

export class NodeInfo {
    name = ''; /** Node label */
    parent?: NodeInfo; /** Undefined or null for root node */
    nodeType: NodeType = NodeType.Suite;

    children: NodeInfo[] = [];
    expanded = false; /** Represent collapse or expanding state */
    selected = false;

    suiteInfo?: ISuiteInfo;
    caseInfo?: ITestCaseInfo;

    constructor(params: {
        name: string;
        nodeType: NodeType;
        children?: NodeInfo[];
        parent?: NodeInfo;
        selected?: boolean;
        suiteInfo?: ISuiteInfo;
        caseInfo?: ITestCaseInfo;
    }) {
        this.name = params.name;
        this.nodeType = params.nodeType;
        this.children = params.children ?? [];
        this.parent = params.parent;
        this.selected = params.selected ?? false;
        this.suiteInfo = params.suiteInfo;
        this.caseInfo = params.caseInfo;
    }

    /**
     * To tree (node) path, build from root/ancestor/parent/node name
     */
    toTreePath(): string {
        const treePath = this.parent ? `${this.parent.toTreePath()}${Node.PATH_SEPARATOR}${this.name}` : this.name;
        return treePath;
    }

    /**
     * Find node from given node path
     * @param treePath node (tree) path
     * @returns Found node
     */
    findNodeByPath(treePath: string): NodeInfo | null {
        const currentTreePath = this.toTreePath();
        if (!treePath.startsWith(currentTreePath)) {
            return null;
        }

        // Search from current node ('this') only
        // Let's trim its parent path
        // - givenPath (parameter):     'root/parent/here/demo'
        // - searchFrom (this):         'root/parent/here'
        // - let's trim the parent path 'root/parent'
        // - --> traverse from          'here'
        const { parentPath } = Node.extractPath(currentTreePath);
        const pathToTraverse = treePath.substring(parentPath.length);

        // Split by separator and ignore empty items
        // Revese array to pop (pick from end) later
        const pathSegments = pathToTraverse.split(Node.PATH_SEPARATOR).filter(Boolean).reverse();
        let children: NodeInfo[] = [this];
        let candidate: NodeInfo | null = null;
        while (pathSegments.length > 0) {
            const nameToFind = pathSegments.pop();
            candidate = children.find((n) => n.name == nameToFind) ?? null;

            if (!candidate) {
                break;
            }

            children = candidate.children ?? [];
        }

        return candidate;
    }

    /**
     * Find node from give source, by give node (tree) path
     * @param nodes List of nodes to lookup from
     * @param treePath node (tree) path to lookup
     * @returns Found node
     */
    static findNodeByPath(nodes: NodeInfo[], treePath: string): NodeInfo | null {
        for (const node of nodes) {
            const found = node.findNodeByPath(treePath);
            if (found) {
                return found;
            }
        }

        return null;
    }

    static sort(nodes: NodeInfo[]): NodeInfo[] {
        // sort by folder-file, then name alphabet
        return lodash.sortBy(
            nodes,
            function (f) {
                return f.nodeType != NodeType.Folder;
            },
            'name'
        );
    }
}
