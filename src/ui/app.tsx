/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { useEffect, useState } from 'react';
import Web3 from 'web3';
import { ToastContainer, toast } from 'react-toastify';
import './app.scss';
import 'react-toastify/dist/ReactToastify.css';

import { SimpleStorageWrapper } from '../lib/contracts/SimpleStorageWrapper';
import { PolyjuiceHttpProvider } from '@polyjuice-provider/web3';
import { CONFIG } from '../config';

import { AddressTranslator } from 'nervos-godwoken-integration';


async function createWeb3() {
    // Modern dapp browsers...
    if ((window as any).ethereum) {
        // const web3 = new Web3((window as any).ethereum);

        const godwokenRpcUrl = CONFIG.WEB3_PROVIDER_URL;
        const providerConfig = {
            rollupTypeHash: CONFIG.ROLLUP_TYPE_HASH,
            ethAccountLockCodeHash: CONFIG.ETH_ACCOUNT_LOCK_CODE_HASH,
            web3Url: godwokenRpcUrl
        };
        const provider = new PolyjuiceHttpProvider(godwokenRpcUrl, providerConfig);
        const web3 = new Web3(provider);

        try {
            // Request account access if needed
            await (window as any).ethereum.enable();
        } catch (error) {
            // User denied account access...
        }

        return web3;
    }

    console.log('Non-Ethereum browser detected. You should consider trying MetaMask!');
    return null;
}

export function App() {
    const [web3, setWeb3] = useState<Web3>(null);
    const [contract, setContract] = useState<SimpleStorageWrapper>();
    const [accounts, setAccounts] = useState<string[]>();
    const [polyjuiceAddress, setPolyjuiceAddress] = useState<string>();
    const [balance, setBalance] = useState<bigint>();
    const [existingContractIdInputValue, setExistingContractIdInputValue] = useState<string>();
    const [storedValue, setStoredValue] = useState<number | undefined>();
    const [transactionInProgress, setTransactionInProgress] = useState(false);
    const toastId = React.useRef(null);
    const [newStoredNumberInputValue, setNewStoredNumberInputValue] = useState<
        number | undefined
    >();

    const [name, setName] = useState<string>();
    const [events, setEvents] = useState<[string,string,string,string][]>();
    const [deployTxHash, setDeployTxHash] = useState<string | undefined>();


    useEffect(() => {
        if (transactionInProgress && !toastId.current) {
            toastId.current = toast.info(
                'Transaction in progress. Confirm MetaMask signing dialog and please wait...',
                {
                    position: 'top-right',
                    autoClose: false,
                    hideProgressBar: false,
                    closeOnClick: false,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    closeButton: false
                }
            );
        } else if (!transactionInProgress && toastId.current) {
            toast.dismiss(toastId.current);
            toastId.current = null;
        }
    }, [transactionInProgress, toastId.current]);

    const account = accounts?.[0];

    async function deployContract() {
        const _contract = new SimpleStorageWrapper(web3);

        try {
            setTransactionInProgress(true);

            const transactionHash = await _contract.deploy(account);

            setDeployTxHash(transactionHash);

            setExistingContractAddress(_contract.address);
            toast(
                'Successfully deployed a smart-contract. You can now proceed to get or set the value in a smart contract.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function getStoredValue() {
        const value = await contract.getStoredValue(account);
        toast('Successfully read latest stored value.', { type: 'success' });

        setStoredValue(value);
    }

    async function setExistingContractAddress(contractAddress: string) {
        const _contract = new SimpleStorageWrapper(web3);
        _contract.useDeployed(contractAddress.trim());

        setContract(_contract);
        setStoredValue(undefined);
    }

    async function setNewStoredValue() {
        try {
            setTransactionInProgress(true);
            await contract.setStoredValue(newStoredNumberInputValue, account);
            toast(
                'Successfully set latest stored value. You can refresh the read value now manually.',
                { type: 'success' }
            );
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
        }
    }

    async function setAddEvent() {
        try {
            setTransactionInProgress(true);
            await contract.addEvent(name, account);
            toast(
                'Successfully added event.',
                { type: 'success' }
            );
            
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            await getEvents();
        }
    }

    async function vote(id:string) {
        try {
            setTransactionInProgress(true);
            await contract.vote(id, account);
            toast(
                'Successfully voted event.',
                { type: 'success' }
            );
            
        } catch (error) {
            console.error(error);
            toast('There was an error sending your transaction. Please check developer console.');
        } finally {
            setTransactionInProgress(false);
            await getEvents();
        }
    }

    async function getEvents() {
        const values = await contract.getEvents(account);
        toast('Successfully read latest stored value.', { type: 'success' });
        console.log(values);
        setEvents(values);
    }

    useEffect(() => {
        if (web3) {
            return;
        }

        (async () => {
            const _web3 = await createWeb3();
            setWeb3(_web3);
            
            const _accounts = [(window as any).ethereum.selectedAddress];
            setAccounts(_accounts);
            
            console.log({ _accounts });

            const addressTranslator = new AddressTranslator();
            const polyjuiceAddress = addressTranslator.ethAddressToGodwokenShortAddress(_accounts[0]);
            setPolyjuiceAddress(polyjuiceAddress);

            if (_accounts && _accounts[0]) {
                const _l2Balance = BigInt(await _web3.eth.getBalance(_accounts[0]));
                setBalance(_l2Balance);
            }
        })();
    });

    const LoadingIndicator = () => <span className="rotating-icon">⚙️</span>;

    return (
        <div>
            Your ETH address: <b>{accounts?.[0]}</b>
            <br />
            <br />
            Your PolyJuice address: <b>{polyjuiceAddress}</b>
            <br />
            <br />
            Balance: <b>{balance ? (balance / 10n ** 8n).toString() : <LoadingIndicator />} ETH</b>
            <br />
            <br />
            Deployed contract address: <b>{contract?.address || '-'}</b> <br />
            <br />
            <br />
            Deploy transaction hash: <b>{deployTxHash || '-'}</b>
            <hr />
            <p>
                The button below will deploy a SimpleStorage smart contract where you can store a
                number value. By default the initial stored value is equal to 123 (you can change
                that in the Solidity smart contract). After the contract is deployed you can either
                read stored value from smart contract or set a new one. You can do that using the
                interface below.
            </p>
            <button onClick={deployContract} disabled={!balance}>
                Deploy contract
            </button>
            &nbsp;or&nbsp;
            <input
                placeholder="Existing contract id"
                onChange={e => setExistingContractIdInputValue(e.target.value)}
            />
            <button
                disabled={!existingContractIdInputValue || !balance}
                onClick={() => setExistingContractAddress(existingContractIdInputValue)}
            >
                Use existing contract
            </button>
            <br />
            <br />
            <br />
            <input
                onChange={e => setName(e.target.value)}
            />
            <button onClick={setAddEvent} disabled={!contract}>
                Add event
            </button>
            <br />
            <br />
            <button onClick={getEvents} disabled={!contract}>
                Get events
            </button>
            <br />
            <br />
            <table style={{ width: 500 }}>
                <thead>
                    <tr>
                        <td>id</td>
                        <td>creator</td>
                        <td>name</td>
                        <td>joined</td>
                    </tr>
                </thead>
                <tbody>
                   {events && events.map(event => <tr><td> {event[0]} </td><td> {event[1]} </td><td> {event[2]} </td><td> {event[3]} </td>
                   <td> 
                    <button onClick={() => vote(event[0])} value={event[0]} disabled={!contract}>Join</button> 
                    </td>
                    </tr>)}
                </tbody>
            </table>
            <hr />
            <ToastContainer />
        </div>
    );
}
