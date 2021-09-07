pragma solidity >=0.8.0;

contract SimpleStorage {
  uint storedData;

  struct Event{
    uint id;
    address creator;
    string name;
    uint joinCount;
  }

  mapping (uint => Event) public events;

  mapping(uint => mapping(address => uint256)) public _allowances;

  uint public eventsCount;

  constructor() payable {
    storedData = 123;
  }

  function addEvent (string memory _name) public {
      eventsCount++;
      events[eventsCount-1] = Event(eventsCount, msg.sender, _name, 0);
      
  }

  function vote(uint id) public payable {
    // require(_allowances[id][msg.sender] == 0);
    events[id-1].joinCount++;
  }

  function getEvents() public view returns (Event[] memory){
    Event[] memory ret = new Event[](eventsCount);
    for (uint i = 0; i < eventsCount; i++) {
        ret[i] = events[i];
    }
    return ret;
  }


  function set(uint x) public payable {
    storedData = x;
  }

  function get() public view returns (uint) {
    return storedData;
  }
}