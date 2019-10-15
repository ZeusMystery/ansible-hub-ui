import * as React from 'react';

import { capitalize } from 'lodash';
import { Link } from 'react-router-dom';

import { Nav, NavExpandable, NavItem, NavList } from '@patternfly/react-core';

import { DocsBlobType } from '../../api';
import { Paths, formatPath } from '../../paths';
import { ParamHelper, sanitizeDocsUrls } from '../../utilities';

class DocsEntry {
    display: string;
    name: string;
    type: string;
    url?: string;
}

interface IState {
    table: {
        documentation: DocsEntry[];
        modules: DocsEntry[];
        roles: DocsEntry[];
        plugins: DocsEntry[];
        playbooks: DocsEntry[];
    };

    collapsedCategories: string[];
}

interface IProps {
    docs_blob: DocsBlobType;
    namespace: string;
    collection: string;
    params: object;
    selectedName?: string;
    selectedType?: string;
    className?: string;
}

export class TableOfContents extends React.Component<IProps, IState> {
    // There's a lot of heavy processing that goes into formatting the table
    // variable. To prevent running everything each time the component renders,
    // we're moving the table variable into state and building it once when the
    // component is loaded.
    constructor(props) {
        super(props);

        const { docs_blob, namespace, collection } = this.props;

        const baseUrlParams = {
            namespace: namespace,
            collection: collection,
        };

        const table = {
            documentation: [] as DocsEntry[],
            modules: [] as DocsEntry[],
            roles: [] as DocsEntry[],
            plugins: [] as DocsEntry[],
            playbooks: [] as DocsEntry[],
        };

        table.documentation.push({
            display: 'Readme',
            url: formatPath(Paths.collectionDocsIndex, baseUrlParams),
            type: 'docs',
            name: 'readme',
        });

        if (docs_blob.documentation_files) {
            for (const file of docs_blob.documentation_files) {
                const url = sanitizeDocsUrls(file.name);
                table.documentation.push({
                    display: this.capitalize(
                        file.name
                            .split('.')[0]
                            .split('_')
                            .join(' '),
                    ),
                    url: formatPath(Paths.collectionDocsPage, {
                        ...baseUrlParams,
                        page: url,
                    }),
                    // selected: selectedType === 'docs' && selectedName === url,
                    type: 'docs',
                    name: url,
                });
            }
        }

        if (docs_blob.contents) {
            for (const content of docs_blob.contents) {
                switch (content.content_type) {
                    case 'role':
                        table.roles.push(
                            this.getContentEntry(content, baseUrlParams),
                        );
                        break;
                    case 'module':
                        table.modules.push(
                            this.getContentEntry(content, baseUrlParams),
                        );
                        break;
                    case 'playbook':
                        table.playbooks.push(
                            this.getContentEntry(content, baseUrlParams),
                        );
                        break;
                    default:
                        table.plugins.push(
                            this.getContentEntry(content, baseUrlParams),
                        );
                        break;
                }
            }
        }

        // Sort docs
        for (const k of Object.keys(table)) {
            table[k].sort((a, b) => {
                // Make sure that anything starting with _ goes to the bottom
                // of the list
                if (a.display.startsWith('_') && !b.display.startsWith('_')) {
                    return 1;
                }
                if (!a.display.startsWith('_') && b.display.startsWith('_')) {
                    return -1;
                }
                return a.display > b.display ? 1 : -1;
            });
        }

        this.state = { table: table, collapsedCategories: [] };
    }

    render() {
        const { className } = this.props;
        const { table } = this.state;

        return (
            <div className={className}>
                <Nav>
                    <NavList>
                        {Object.keys(table).map(key =>
                            table[key].length === 0
                                ? null
                                : this.renderLinks(table[key], key),
                        )}
                    </NavList>
                </Nav>
            </div>
        );
    }

    private renderLinks(links, title) {
        const isExpanded = !this.state.collapsedCategories.includes(title);

        return (
            <NavExpandable
                key={title}
                title={capitalize(`${title} (${links.length})`)}
                isExpanded={isExpanded}
                isActive={this.getSelectedCategory() === title}
            >
                {links.map((link: DocsEntry, index) => (
                    <NavItem key={index} isActive={this.isSelected(link)}>
                        <Link
                            style={{
                                textOverflow: 'ellipses',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap',
                            }}
                            to={
                                link.url +
                                (Object.keys(this.props.params).length != 0
                                    ? '?' +
                                      ParamHelper.getQueryString(
                                          this.props.params,
                                      )
                                    : '')
                            }
                        >
                            <span
                                style={{
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    display: 'block',
                                }}
                            >
                                {link.display}
                            </span>
                        </Link>
                    </NavItem>
                ))}
            </NavExpandable>
        );
    }

    private isSelected(entry: DocsEntry): boolean {
        // the readme's url is always docs/, so load it when the name is null
        if (!this.props.selectedName && entry.name === 'readme') {
            return true;
        }

        return (
            // selected name and type are the values found for type and name
            // in the page url
            this.props.selectedName === entry.name &&
            this.props.selectedType === entry.type
        );
    }

    private getSelectedCategory(): string {
        const { selectedType } = this.props;
        if (!selectedType || selectedType === 'docs') {
            return 'documentation';
        }

        if (selectedType === 'role') {
            return 'roles';
        }

        if (selectedType === 'module') {
            return 'modules';
        }

        return 'plugins';
    }

    private capitalize(s: string) {
        return s.slice(0, 1).toUpperCase() + s.slice(1);
    }

    private getContentEntry(content, base): DocsEntry {
        return {
            display: content.content_name,
            url: formatPath(Paths.collectionContentDocs, {
                ...base,
                type: content.content_type,
                name: content.content_name,
            }),
            name: content.content_name,
            type: content.content_type,
        };
    }
}
