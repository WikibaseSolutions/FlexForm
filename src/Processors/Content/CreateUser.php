<?php

namespace FlexForm\Processors\Content;

use FlexForm\Core\Core;
use FlexForm\FlexFormException;
use MediaWiki\HookContainer\HookRunner;
use MediaWiki\MediaWikiServices;
use PasswordError;
use User;

class CreateUser {

	/**
	 * @var mixed|string
	 */
	private $userName;

	/**
	 * @var mixed|string
	 */
	private $emailAddress;

	/**
	 * @var mixed|string
	 */
	private $realName;

	/**
	 * @var
	 */
	private $passWord;

	public function __construct() {
		$fields    = ContentCore::getFields();
		$explodedContent = explode( Core::DIVIDER, $fields['createuser'] );
		if ( isset( $explodedContent[0] ) && isset( $explodedContent[1] ) ) {
			$this->userName     = $explodedContent[0];
			$this->emailAddress = $explodedContent[1];
		}
		if ( isset( $explodedContent[2] ) && $explodedContent[2] !== '' ) {
			$this->realName = $explodedContent[2];
		}
	}

	/**
	 * @return User
	 * @throws FlexFormException
	 */
	public function addUser(): User {
		$user = User::createNew( $this->getUserName(), [
			'email' => $this->getEmailAddress(),
			'email_authenticated' => null,
			'real_name' => $this->getRealName()
		] );
		if ( $user === null ) {
			throw new FlexFormException(
				wfMessage( 'flexform-createuser-username-exists', $this->getUserName() )->text(),
				0
			);
		}
		$hookContainer = MediaWikiServices::getInstance()->getHookContainer();
		$hookRunner = new HookRunner( $hookContainer );
		$hookRunner->onLocalUserCreated( $user, false );
		return $user;
	}

	private function createPassword() {
		$comb = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		$shfl = str_shuffle( $comb );
		$this->passWord = substr( $shfl, 0, 8 );
	}

	/**
	 * @param User $user
	 *
	 * @return User
	 * @throws FlexFormException
	 */
	private function setPassword( User $user ): User {
		# Try to set the password
		$this->createPassword();
		try {
			$status = $user->changeAuthenticationData( [
														   'username' => $user->getName(),
														   'password' => $this->passWord,
														   'retype'   => $this->passWord,
													   ] );
			if ( !$status->isGood() ) {
				throw new PasswordError(
					$status->getMessage(
						false,
						false,
						'en'
					)->text()
				);
			}
		} catch ( PasswordError $pwe ) {
			throw new FlexFormException(
				wfMessage( $pwe->getText(), 0 )
			);
		}
		return $user;
	}

	/**
	 * @param User $user
	 *
	 * @return void
	 * @throws FlexFormException
	 */
	public function sendPassWordAndConfirmationLink( User $user ) {
		$user = $this->setPassword( $user );
		/*
		$template = file_get_contents(
			$IP . '/extensions/FlexForm/src/Templates/createUserEmailConfirmation.tpl'
		);
		$searchFor = [
			'%%realname%%',
			'%%username%%',
			'%%password%%'
		];
		*/

		if ( $this->getRealName() === null || $this->getRealName() === '' ) {
			$rName = $this->getUserName();
		} else {
			$rName = $this->getRealName();
		}
		/*
		$replaceWith = [
			$rName,
			$this->getUserName(),
			$this->passWord
		];
		$template = str_replace( $searchFor, $replaceWith, $template );
		*/
		$template = wfMessage( 'flexform-createuser-email', $rName, $this->getUserName(), $this->passWord )->plain();
		$user->sendConfirmationMail();
		$user->sendMail( 'Account registration', $template );
	}

	/**
	 * @return mixed|string
	 */
	public function getUserName() {
		return $this->userName;
	}

	/**
	 * @return mixed|string
	 */
	public function getEmailAddress() {
		return $this->emailAddress;
	}

	/**
	 * @return mixed|string
	 */
	public function getRealName() {
		return $this->realName;
	}
}