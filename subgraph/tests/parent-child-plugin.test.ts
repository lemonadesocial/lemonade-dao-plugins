import {
  afterAll,
  assert,
  beforeAll,
  clearStore,
  describe,
  test,
} from "matchstick-as/assembly/index";
import { Address } from "@graphprotocol/graph-ts";
import {
  handleDeactivated,
  handleParentSet,
  handleParentUnset,
  handleProposalIntervened,
} from "../src/parent-child-plugin";
import {
  createDeactivatedEvent,
  createParentSetEvent,
  createParentUnsetEvent,
  createProposalIntervenedEvent,
} from "./parent-child-plugin-utils";

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("ParentSetEvent", () => {
  beforeAll(() => {
    let parent = Address.fromString(
      "0x0000000000000000000000000000000000000001",
    );
    let child = Address.fromString(
      "0x0000000000000000000000000000000000000002",
    );
    let hardLink = true;
    let newParentSetEvent = createParentSetEvent(parent, child, hardLink);
    handleParentSet(newParentSetEvent);
  });

  afterAll(() => {
    clearStore();
  });

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("ParentSet created and stored", () => {
    assert.entityCount("ParentSet", 1);

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ParentSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "parent",
      "0x0000000000000000000000000000000000000001",
    );
    assert.fieldEquals(
      "ParentSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "child",
      "0x0000000000000000000000000000000000000002",
    );
    assert.fieldEquals(
      "ParentSet",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "hardLink",
      "0x0000000000000000000000000000000000000001",
    );

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  });
});
