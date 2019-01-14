import ParentTileImg from "./ParentTileImg";

require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
//This has been tested on IAUX & should be moveable to IAUX just by switching the commented headers below -
//IAUX version
//import React from 'react'
//import IAReactComponent from 'iacomponents/experimental/IAReactComponent';
//import PropTypes from 'prop-types'
//!IAUX version
const debug = require('debug')('TileComponent');
import React from "../ReactFake";
import IAReactComponent from './IAReactComponent';
import ArchiveItem from "@internetarchive/dweb-archivecontroller/ArchiveItem";
import Util from "../Util";
import TileImage from "./TileImage";

export default class TileComponent extends IAReactComponent {
    /* -- Not used with ReactFake yet
    static propTypes = {
        identifier: PropTypes.string,
        member: PropTypes.object,
        parentidentifier: PropTypes.string,
        //item: PropTypes.string - if ever have a case where have the item then edit code below to use, rather than refetching
    };
    */
    constructor(props)
    {
        super(props);
        if (props.member && !props.identifier) { this.props.identifier = props.member.identifier; }
    }

    loadAndSync(enclosingdiv) {
        try {
            console.assert(this.props.member, "If using loadAndSync should have a member with at least mediatype to work with");
            // We need some data for tiles, if its not found then have to fetch item metadata and then render
            //TODO = catch cases (if-any) where this is triggered (maybe related, maybe fav-brewster) and see if can use expansion instead
            console.assert(this.props.member.creator && this.props.member.creator.length, "next code shouldnt be needed as expand");
            /*
            if (!(this.props.member.creator && this.props.member.creator.length)) { // This may not be best test
                if (!this.props.item) this.props.item = new ArchiveItem({itemid: this.props.identifier});
                if (!this.props.item.metadata) {
                    this.props.item.fetch_metadata((err, ai) => {
                        if (err) {
                            debug("Failed to read metadata for %s", this.props.identifier);
                            enclosingdiv.parentNode.removeChild(enclosingdiv);
                        } else {
                            this.loadAndSync(enclosingdiv);
                        }
                    });
                    return;
                } // If metadata drop through
            }
            */
            const member = this.props.member;
            const item = this.props.item;
            const isCollection = (member.mediatype === 'collection');
            const collection0 = member.collection0() || (item && item.metadata.collection[0]);
            const by = member.creator || member.creatorSorter || (item && item.metadata.creator);
            const collection = member.collection || (item && item.metadata.collection); // Should be array
            const nFavorites = collection.filter(e => e.startsWith('fav-')).length;  // Jira added since cant get this any more
            const collectionSize = member.item_count; //TODO really hard to get https://github.com/internetarchive/dweb-archive/issues/91
            this.setState({
                isCollection, collection0, by, nFavorites, collectionSize,
                mediatype: member.mediatype,
                collection0title: member.collection0title || (item && item.collection_titles[collection0]),
                classes: 'item-ia' + (isCollection ? ' collection-ia' : ''),
                byTitle: Array.isArray(by) ? by.join(',') : by,
                downloads: member.downloads, // Often undefined
                title: member.title || (item && item.metadata.title),
                date: (member.publicdate || member.updateddate || (item && item.metadata.publicdate)).substr(0, 10), // No current cases where none of these dates exist
                iconnameClass: "iconochive-"+Util.mediatype_canonical(member.mediatype),
                numReviews: member.num_reviews || (item && item.reviews && item.reviews.length) || 0
            })
            const innerElement = this.renderInnerElement();
            while (enclosingdiv.lastChild) {
                enclosingdiv.removeChild(enclosingdiv.lastChild)
            }
            enclosingdiv.appendChild(innerElement)
        } catch(err) { // Catch error here as not generating debugging info at caller level for some reason
            debug("ERROR in TileComponent.loadAndSync for %s:", this.props.identifier, err.message);
            enclosingdiv.parentNode.removeChild(enclosingdiv);
        }
    }

    render() {
        if (typeof DwebArchive !== "undefined") {
            return <span ref={this.loadAndSync}>Loading ...</span>
        } else { // Pure IAUX
            //TODO-IAUX need pure IAUX version
        }
    }

    renderInnerElement() {
        return (
        <div className={this.state.classes} data-id={this.props.identifier}  key={this.props.identifier}>
            { (this.state.collection0) ? //TODO make it work for ParentTileImage in new TileComponent then remove this condition
                <a className="stealth" tabIndex="-1" href={`/details/${this.state.collection0}`} onClick={`Nav.nav_details("${this.state.collection0}");`}>
                    <div className="item-parent">
                        <div className="item-parent-img">
                            <ParentTileImg member={this.props.member} identifier={this.props.identifier} parentidentifier={this.state.collection0} />
                        </div>
                        <div className="item-parent-ttl">{this.state.collection0title}</div>
                    </div>{/*.item-parent*/}
                </a>
                : undefined }
            <div className="hidden-tiles views C C1">
                <nobr className="hidden-xs">{Util.number_format(this.state.downloads)}</nobr>
                <nobr className="hidden-sm hidden-md hidden-lg">{Util.number_format(this.state.downloads)}</nobr>
            </div>


            <div className="C234">
                <div className="item-ttl C C2">
                    <a onClick={`Nav.nav_details("${this.props.identifier}");`} title={this.state.title}>
                        <div className="tile-img">
                            <TileImage className="item-img clipW clipH" imgname={"__ia_thumb.jpg"} member={this.props.member} identifier={this.props.identifier} />
                            {/*<img className="item-img clipW clipH" imgname={imgname} src={member}/>*/}
                        </div>{/*.tile-img*/}
                        <div className="ttl">
                            {this.state.title}
                        </div>
                    </a>
                </div>

                <div className="hidden-tiles pubdate C C3">
                    <nobr className="hidden-xs">{this.state.date}</nobr>
                    <nobr className="hidden-sm hidden-md hidden-lg">{this.state.date}</nobr>
                </div>

                {this.state.by && this.state.by.length ?
                    <div className="by C C4">
                        <span className="hidden-lists">by </span>
                        <span title={this.state.byTitle}>{this.state.byTitle}</span>
                    </div>
                    : undefined }
            </div>{/*.C234*/}
            {this.state.isCollection ? this.renderDivCollectionStats() : this.renderDivStatbar() }
        </div>
    );
    }


    renderDivCollectionStats(){
        //TODO fix 000 in num_items see https://github.com/internetarchive/dweb-archive/issues/91
        return (
            <div className="collection-stats">
                <div className="iconochive-collection topinblock hidden-lists" aria-hidden="true"></div>
                <span className="sr-only">collection</span>
                <div className="num-items topinblock">
                    {Util.number_format(this.state.collectionSize)} <div className="micro-label">ITEMS</div>
                </div>
                <div className="num-items hidden-tiles">
                    {Util.number_format(this.state.downloads)}
                    <div className="micro-label">VIEWS</div>
                </div>
            </div>
        );
    }

    renderDivStatbar() { // <div class=statbar>
        return (
            <div className="statbar ">
                <div className="mt-icon C C5">
                    <span className={this.state.iconnameClass} aria-hidden="true"></span><span className="sr-only">{this.state.mediatype}</span></div>
                <h6 className="stat ">
                    <span className="iconochive-eye" aria-hidden="true"></span><span className="sr-only">eye</span>
                    <nobr>{Util.number_format(Util.number_format(this.state.downloads))}</nobr>
                </h6>

                { typeof this.state.nFavorites === "undefined" ? undefined :
                    <h6 className="stat">
                        <span className="iconochive-favorite" aria-hidden="true"></span><span
                        className="sr-only">favorite</span> {Util.number_format(this.state.nFavorites)} </h6>
                }
                <h6 className="stat">
                    <span className="iconochive-comment" aria-hidden="true"></span><span className="sr-only">comment</span> {Util.number_format(this.state.numReviews)}
                </h6>
            </div>
        )
    }


}
