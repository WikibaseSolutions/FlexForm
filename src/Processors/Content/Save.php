<?php

namespace wsform\processors\content;

use CommentStoreComment;
use ContentHandler;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;
use MWException;
use RequestContext;
use Title;
use User;
use WikiPage;
use WSForm\Core\HandleResponse;
use WSForm\WSFormException;

class Save {

	private function removeCarriageReturnFromContent( $content ){
		return str_replace("\r", '' , $content );
	}

	/**
	 * @param User $user The user that performs the edit
	 * @param WikiPage $wikipage_object The page to edit
	 * @param array $text $key is slotname and value is the text to insert
	 * @param string $summary The summary to use
	 *
	 * @return true|array True on success, and an error message with an error code otherwise
	 *
	 * @throws \MWContentSerializationException Should not happen
	 * @throws \MWException Should not happen
	 */
	private function editSlots(
		User $user,
		WikiPage $wikipage_object,
		array $text,
		string $summary
	) {
		$status              = true;
		$errors              = array();
		$title_object        = $wikipage_object->getTitle();
		$page_updater        = $wikipage_object->newPageUpdater( $user );
		$old_revision_record = $wikipage_object->getRevisionRecord();
		$slot_role_registry  = MediaWikiServices::getInstance()->getSlotRoleRegistry();

		// loop through all slots we need to edit/create
		foreach ( $text as $slot_name => $content ) {
			$content = $this->removeCarriageReturnFromContent( $content );
			// Make sure the slot we are editing is defined in MW else skip this slot
			if ( ! $slot_role_registry->isDefinedRole( $slot_name ) ) {
				$status   = false;
				$errors[] = wfMessage(
					"wsform-unkown-slot",
					$slot_name
				); // TODO: Update message name
				unset( $text[$slot_name] );
				continue;
			}
			if ( $content === "" && $slot_name !== SlotRecord::MAIN ) {
				// Remove the slot if $content is empty and the slot name is not MAIN
				$page_updater->removeSlot( $slot_name );
			} else {
				// Set the content for the slot we want to edit

				// If the page exists and has this slot
				if ( $old_revision_record !== null && $old_revision_record->hasSlot( $slot_name ) ) {
					$model_id = $old_revision_record->getSlot( $slot_name )->getContent()->getContentHandler()
					                                ->getModelID();
				} else {
					$model_id = $slot_role_registry->getRoleHandler( $slot_name )->getDefaultModel( $title_object );
				}

				$slot_content = ContentHandler::makeContent(
					$content,
					$title_object,
					$model_id
				);
				$page_updater->setContent(
					$slot_name,
					$slot_content
				);
				/*
				if ( $slot_name !== SlotRecord::MAIN ) {
					$page_updater->addTag( 'wsslots-slot-edit' ); // TODO: Update message name
				}
				*/
			}
		}

		// Are we creating a new page while filling a slot other than main?
		if ( $old_revision_record === null && ! isset( $text[SlotRecord::MAIN] ) ) {
			// The 'main' content slot MUST be set when creating a new page
			$main_content = ContentHandler::makeContent(
				"",
				$title_object
			);
			$page_updater->setContent(
				SlotRecord::MAIN,
				$main_content
			);
		}

		$comment = CommentStoreComment::newUnsavedComment( $summary );
		$page_updater->saveRevision(
			$comment,
			EDIT_INTERNAL
		);
		if ( ! $page_updater->isUnchanged() ) {
			// Perform an additional null-edit to make sure all page properties are up-to-date
			$comment      = CommentStoreComment::newUnsavedComment( "" );
			$page_updater = $wikipage_object->newPageUpdater( $user );
			$page_updater->saveRevision(
				$comment,
				EDIT_SUPPRESS_RC | EDIT_AUTOSUMMARY
			);
		}
		if ( true === $status ) {
			return true;
		} else {
			return $errors;
		}
	}

	/**
	 * @throws WSFormException
	 * @throws \MWException
	 */
	public function saveToWiki( $title, $contentArray, $summary ) {
		$user = RequestContext::getMain()->getUser();
		$title = Title::newFromText( $title );
		if ( ! $title || $title->hasFragment() ) {
			throw new WSFormException( "Invalid title $title." );
		}

		// $slot is now an array as of v0.8.0.9.8.8
		try {
			$wikiPageObject = WikiPage::factory( $title );
		} catch ( MWException $e ) {
			throw new WSFormException(
				"Could not create a WikiPage Object from title " . $title->getText() . '. Message ' . $e->getMessage(), 0, $e
			);
		}
		$saveResult = $this->editSlots( $user, $wikiPageObject, $contentArray, $summary );

	}

}