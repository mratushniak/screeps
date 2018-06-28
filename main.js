module.exports.loop = function () {

	const creepLimit = 16;
	const creepBody = [ WORK, WORK, CARRY, MOVE ];
    
    creepCost = 0;
    for (let bodyPart of creepBody) {
        creepCost += BODYPART_COST[bodyPart];
    }
    
	var creepCount = 0;
	
	// census/renumbering
	
	for ( let creepName in Game.creeps ) {
		let creep = Game.creeps [ creepName ];
		creep.serialNum = creepCount;
		creepCount++;
	}
	if (Game.time % 10 == 0) console.log('There are', creepCount, 'creeps.');
	
	// memory management
	
	if ( Game.time % 1000 === 0 ) {
		console.log( "cleaning memory at tick", Game.time, "..." ) ;
		for ( let creepName in Memory.creeps ) {
			if ( Game.creeps [ creepName ] === undefined ) {
				console.log( "cleaning memory of", creepName );
				delete Memory.creeps [ creepName ] ;
			}
		}
	}
	
	// auto-spawn
	
	if ( creepCount < creepLimit ) {
		let creepName = Game.spawns.Spawn1.createCreep( creepBody );
		if ( typeof creepName === "string" ) {
			console.log( "now spawning", creepName );
			Game.creeps[ creepName ].memory.harvesting = true;
			creepCount++;
			console.log('There are now', creepCount, 'creeps.');
		}
	}
	
	// run creeps
	
	for ( let creepName in Game.creeps ) {
		let creep = Game.creeps[creepName];
		runCreep(creep, creepCount, creepLimit, creepCost);
	}
	
	for ( let towerName in Game.structures ) {
	    let tower = Game.structures[towerName];
	    if ( tower.isActive && tower.structureType == STRUCTURE_TOWER ) {
	        let hostiles = tower.room.find( FIND_HOSTILE_CREEPS )
	        if ( hostiles.length ) {
	            tower.attack( hostiles[0] );
	        }
	    }
	}
	    
	return;
}

function runCreep( creep, creepCount, creepLimit, creepCost ) {
	
	//console.log( "running", creep.name );
	
	creep.memory.harvesting = (( creep.memory.harvesting || ( creep.carry.energy === 0 )) &&
	                          ( creep.carry.energy < creep.carryCapacity ));
	
	if ( creep.memory.harvesting === true ) {
		creepHarvest( creep );
	} else {
		creepReturn( creep, creepCount, creepLimit, creepCost );
	}
	
	return;
}

function creepHarvest( creep ) {
	
	if ( creep.room.find( FIND_DROPPED_RESOURCES, {filter: function(resource) {return resource.resourceType == RESOURCE_ENERGY;}}).length > 0 && creep.pickup( creep.pos.findClosestByRange( FIND_DROPPED_RESOURCES ) != OK )) {
	    creep.moveTo( creep.pos.findClosestByPath( FIND_DROPPED_RESOURCES, {filter: function(resource) {return resource.resourceType == RESOURCE_ENERGY;}}));
	} else if ( creep.room.find( FIND_TOMBSTONES, {filter: function(tombstone) {return tombstone.store[RESOURCE_ENERGY] > 0;}}).length > 0 && creep.withdraw( creep.pos.findClosestByRange( FIND_TOMBSTONES ), RESOURCE_ENERGY ) != OK ) {
	    creep.moveTo( creep.pos.findClosestByPath( FIND_TOMBSTONES, {filter: function(tombstone) {return tombstone.store[RESOURCE_ENERGY] > 0;}}));
	} else if ( creep.harvest( creep.pos.findClosestByRange( FIND_SOURCES_ACTIVE )) != OK ) {
	    creep.moveTo( creep.pos.findClosestByPath( FIND_SOURCES_ACTIVE ));
	}
	
	//console.log(creep.name, "is harvesting");
	
	return;
}

function creepReturn( creep, creepCount, creepLimit, creepCost ) {
	
	var closestSpawn = creep.pos.findClosestByRange( FIND_MY_SPAWNS );
	
	if ( creep.serialNum < 1 && creep.room.controller.ticksToDowngrade < 2500 ) {
	    if ( creep.upgradeController( creep.room.controller != OK )) {
	        creep.moveTo( creep.room.controller );
	    }
	} else if (( creep.serialNum < 1 || creep.ticksToLive < 150 ) && ( creepCount < creepLimit || creep.room.controller.energy < creep.room.controller.energyCapacity - creep.ticksToLive )) {
	    if ( creep.transfer( closestSpawn, RESOURCE_ENERGY ) != OK ) {
		    creep.moveTo( closestSpawn );
	    }
	} else {
	    if ( creep.upgradeController( creep.room.controller ) != OK ) {
	        creep.moveTo( creep.room.controller );
	    }
	}
	
	//console.log(creep.name, "is returning");
	
	return;
}
